# Token Budget System Setup Guide

## Overview

The token budget system has been implemented with STRICT enforcement:
- **Trial Users**: 7 days FREE, 6,000 tokens
- **After 7 Days**: User MUST upgrade to Lite/Pro/Business plan
- **Monthly Limits**: Enforced BEFORE processing jobs (no token waste)

## Step 1: Run Supabase Migration

You MUST run the SQL migration to add billing columns to your Supabase database.

### Instructions:

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of `docs/supabase-billing-migration.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

### What This Does:

- Adds billing columns to `profiles` table:
  - `plan` - trial/lite/pro/business (default: trial)
  - `trial_start_date` - Auto-set on user signup
  - `trial_end_date` - Auto-set to signup + 7 days
  - `tokens_used_this_month` - Running total (resets monthly)
  - `monthly_token_limit` - 6K/200K/500K/4M based on plan
  - `billing_period_start` - Current billing cycle start
  - `billing_period_end` - When billing resets (30 days)
  - `subscription_status` - active/expired/cancelled

- Creates triggers:
  - `set_trial_period()` - Auto-sets trial dates for new users

- Creates functions:
  - `is_trial_expired()` - Check if trial period has passed
  - `has_exceeded_token_limit()` - Check if monthly quota exceeded
  - `reset_monthly_tokens()` - Reset usage at billing cycle end

- Creates indexes for fast queries

### Verify Migration Success:

Run this query in Supabase SQL Editor to verify:

```sql
SELECT
  id,
  email,
  plan,
  trial_end_date,
  tokens_used_this_month,
  monthly_token_limit,
  billing_period_end
FROM public.profiles
LIMIT 5;
```

You should see the new columns populated with default values.

## Step 2: Test Trial Enforcement

### Test Scenario 1: New Trial User

1. Create a new user account (signup)
2. Check their profile in Supabase:
   - `plan` should be `'trial'`
   - `trial_end_date` should be `created_at + 7 days`
   - `monthly_token_limit` should be `6000`
   - `tokens_used_this_month` should be `0`

3. Submit a code review job
4. Check the job completes successfully
5. Check `tokens_used_this_month` increased by actual tokens used

### Test Scenario 2: Trial Expiration

**Option A: Manual Test (Immediate)**
1. In Supabase, manually update a test user:
   ```sql
   UPDATE public.profiles
   SET trial_end_date = NOW() - INTERVAL '1 day'
   WHERE email = 'test@example.com';
   ```

2. Try to submit a job as this user
3. Job should FAIL immediately with:
   ```
   "Your 7-day free trial has expired. Please upgrade to Lite, Pro, or Business plan to continue."
   ```

**Option B: Natural Test (Wait 7 Days)**
1. Create a test account
2. Wait 7 days
3. Try to submit a job
4. Should fail with trial expiration message

### Test Scenario 3: Token Limit Enforcement

1. In Supabase, manually set a user close to limit:
   ```sql
   UPDATE public.profiles
   SET
     tokens_used_this_month = 5500,
     monthly_token_limit = 6000
   WHERE email = 'test@example.com';
   ```

2. Try to submit a large job (estimated > 500 tokens)
3. Job should FAIL with:
   ```
   "Insufficient tokens. You have 500 tokens remaining, but this request needs ~1500 tokens."
   ```

### Test Scenario 4: Soft Throttle Warning

1. Set user to 90%+ usage:
   ```sql
   UPDATE public.profiles
   SET tokens_used_this_month = 5500
   WHERE email = 'test@example.com';
   ```

2. Submit a small job (< 500 tokens)
3. Job should SUCCEED but log warning:
   ```
   ⚠️  WARNING: User at 91.7% of quota
   ```

## Step 3: Pricing Tiers

| Plan     | Tokens/Month | Price  | Duration   |
|----------|-------------|--------|------------|
| Trial    | 6,000       | $0     | 7 days     |
| Lite     | 200,000     | $15    | 30 days    |
| Pro      | 500,000     | $30    | 30 days    |
| Business | 4,000,000   | $200   | 30 days    |

### Upgrade User Manually (Until Payment Integration):

To upgrade a user from trial to a paid plan:

```sql
UPDATE public.profiles
SET
  plan = 'pro',  -- or 'lite', 'business'
  monthly_token_limit = 500000,  -- 200000 for lite, 4000000 for business
  subscription_status = 'active',
  billing_period_start = NOW(),
  billing_period_end = NOW() + INTERVAL '30 days',
  tokens_used_this_month = 0  -- Reset for new billing period
WHERE email = 'user@example.com';
```

## Step 4: Backend Environment Variables

Make sure these are set in `backend/python-worker/.env`:

```bash
# Supabase (for user profiles and billing)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# MongoDB (for detailed token tracking)
MONGO_URI=mongodb://localhost:27017/code_insight
```

## Step 5: MongoDB Token Tracking

The system automatically creates a `token_usage` collection in MongoDB with:

**Document Structure:**
```json
{
  "user_id": "uuid",
  "job_id": "job_123",
  "job_type": "review|debug|architecture",
  "input_tokens": 1234,
  "output_tokens": 567,
  "total_tokens": 1801,
  "model": "claude-3-5-sonnet",
  "timestamp": "2025-10-16T10:30:00Z",
  "billing_period_month": "2025-10"
}
```

**Indexes:**
- `user_id + timestamp` (for recent usage)
- `user_id + billing_period_month` (for monthly analytics)

## Step 6: Frontend Updates Needed

### Billing Page (`frontend/src/app/dashboard/billing/page.tsx`)

Add real-time token usage display:
- Current plan badge
- Tokens used progress bar
- Days remaining in trial (if applicable)
- Upgrade buttons
- Pricing comparison table

### Dashboard (`frontend/src/app/dashboard/page.tsx`)

Add token usage widget:
- Remaining tokens display
- Usage percentage
- Warning message at 90%+
- Quick link to billing page

### Landing Page (`frontend/src/app/page.tsx`)

Update pricing section:
- Highlight 7-day free trial
- Show all 4 tiers (Trial/Lite/Pro/Business)
- Feature comparison table
- Clear CTAs

## Step 7: How Enforcement Works

### Pre-Flight Check (STEP 0 of Pipeline)

Before ANY job is processed:

1. Estimate tokens needed:
   ```python
   estimated_tokens = len(code) / 4 + 2000  # rough estimate
   ```

2. Check budget:
   ```python
   budget_allowed, reason, budget_info = token_budget_service.check_budget_availability(
       user_id, estimated_tokens
   )
   ```

3. Three possible outcomes:
   - **trial_expired**: Job fails, user must upgrade
   - **limit_exceeded**: Job fails, user must upgrade or wait for reset
   - **insufficient_tokens**: Job fails, not enough tokens remaining
   - **approved**: Job proceeds to Claude API

4. If rejected:
   - Job status → "failed"
   - WebSocket notification sent to user
   - Error message with upgrade prompt
   - **Claude API never called** (saves tokens!)

### Post-Completion Recording

After job completes successfully:

1. Record in MongoDB (detailed tracking):
   ```python
   token_usage_collection.insert_one({
       "user_id": user_id,
       "job_id": job_id,
       "job_type": "review",
       "total_tokens": 1801,
       ...
   })
   ```

2. Update Supabase (running total):
   ```python
   UPDATE profiles
   SET tokens_used_this_month = tokens_used_this_month + 1801
   WHERE id = user_id;
   ```

## Step 8: Monthly Reset (Cron Job)

Set up a cron job to reset monthly tokens:

```sql
-- Run this on the 1st of every month
SELECT public.reset_monthly_tokens();
```

Or use Supabase Edge Functions with a scheduled trigger.

## Troubleshooting

### Issue: Trial not expiring after 7 days

**Check:**
```sql
SELECT
  email,
  plan,
  trial_start_date,
  trial_end_date,
  NOW() as current_time,
  trial_end_date < NOW() as is_expired
FROM public.profiles
WHERE plan = 'trial';
```

**Fix:**
Make sure trigger is active:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'set_trial_period_trigger';
```

### Issue: Token usage not recording

**Check:**
1. MongoDB connection in backend logs
2. Supabase service key has write permissions
3. Check backend logs for "✅ Recorded X tokens"

**Debug:**
```python
# In backend logs, look for:
print("✅ Recorded {total_tokens} tokens for user {user_id[:8]}... (Total: {new_total})")
```

### Issue: Jobs not failing when trial expired

**Check:**
Backend logs for STEP 0:
```
💰 Step 0: Checking token budget...
❌ Token budget check failed: trial_expired
```

**Verify:**
```sql
SELECT public.is_trial_expired('user-uuid-here');
-- Should return TRUE if expired
```

## Summary

✅ Backend enforcement COMPLETE
✅ Supabase schema ready
✅ MongoDB tracking ready
⏳ Frontend display PENDING
⏳ Payment integration PENDING

**User must:**
1. Run `docs/supabase-billing-migration.sql` in Supabase SQL Editor
2. Test trial enforcement manually
3. Update frontend to display token usage
4. Set up monthly reset cron job
