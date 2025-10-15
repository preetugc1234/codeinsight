-- ============================================
-- Code Insight - Billing & Token Budget System
-- Run this in Supabase SQL Editor
-- ============================================

-- Add billing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'lite', 'pro', 'business')),
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS tokens_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_token_limit INTEGER DEFAULT 6000,
ADD COLUMN IF NOT EXISTS billing_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS billing_period_end TIMESTAMP WITH TIME ZONE;

-- Update existing plan column if needed (drop old constraint, add new one)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('trial', 'lite', 'pro', 'business'));

-- Create function to set trial end date (7 days from signup)
CREATE OR REPLACE FUNCTION public.set_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial end date to 7 days from signup for new users
  IF NEW.trial_start_date IS NOT NULL AND NEW.trial_end_date IS NULL THEN
    NEW.trial_end_date = NEW.trial_start_date + INTERVAL '7 days';
  END IF;

  -- Set billing period end to 30 days from start
  IF NEW.billing_period_start IS NOT NULL AND NEW.billing_period_end IS NULL THEN
    NEW.billing_period_end = NEW.billing_period_start + INTERVAL '30 days';
  END IF;

  -- Set token limits based on plan
  IF NEW.plan = 'trial' THEN
    NEW.monthly_token_limit = 6000;
  ELSIF NEW.plan = 'lite' THEN
    NEW.monthly_token_limit = 200000;
  ELSIF NEW.plan = 'pro' THEN
    NEW.monthly_token_limit = 500000;
  ELSIF NEW.plan = 'business' THEN
    NEW.monthly_token_limit = 4000000;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_trial_period_trigger ON public.profiles;

-- Create trigger to set trial period on INSERT and UPDATE
CREATE TRIGGER set_trial_period_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_period();

-- Update existing users to trial plan with trial period
UPDATE public.profiles
SET
  plan = 'trial',
  trial_start_date = COALESCE(trial_start_date, created_at),
  trial_end_date = COALESCE(trial_end_date, created_at + INTERVAL '7 days'),
  tokens_used_this_month = COALESCE(tokens_used_this_month, 0),
  monthly_token_limit = 6000,
  billing_period_start = COALESCE(billing_period_start, created_at),
  billing_period_end = COALESCE(billing_period_end, created_at + INTERVAL '30 days')
WHERE plan NOT IN ('trial', 'lite', 'pro', 'business');

-- Create index for faster billing queries
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS profiles_trial_end_idx ON public.profiles(trial_end_date);
CREATE INDEX IF NOT EXISTS profiles_billing_period_idx ON public.profiles(billing_period_end);

-- Create function to check if trial has expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_plan TEXT;
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT plan, trial_end_date INTO profile_plan, trial_end
  FROM public.profiles
  WHERE id = user_id;

  -- If on trial and trial has expired, return true
  IF profile_plan = 'trial' AND trial_end < timezone('utc'::text, now()) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has exceeded token limit
CREATE OR REPLACE FUNCTION public.has_exceeded_token_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  tokens_used INTEGER;
  token_limit INTEGER;
BEGIN
  SELECT tokens_used_this_month, monthly_token_limit INTO tokens_used, token_limit
  FROM public.profiles
  WHERE id = user_id;

  IF tokens_used >= token_limit THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly tokens (run this via cron monthly)
CREATE OR REPLACE FUNCTION public.reset_monthly_tokens()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    tokens_used_this_month = 0,
    billing_period_start = timezone('utc'::text, now()),
    billing_period_end = timezone('utc'::text, now()) + INTERVAL '30 days'
  WHERE billing_period_end < timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_trial_expired TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_exceeded_token_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_monthly_tokens TO service_role;

COMMENT ON COLUMN public.profiles.plan IS 'User subscription plan: trial (7 days, 6K tokens), lite ($15/mo, 200K), pro ($30/mo, 500K), business ($200/mo, 4M)';
COMMENT ON COLUMN public.profiles.trial_start_date IS 'When the user started their trial';
COMMENT ON COLUMN public.profiles.trial_end_date IS 'When the trial expires (7 days after signup)';
COMMENT ON COLUMN public.profiles.tokens_used_this_month IS 'Total tokens consumed in current billing period';
COMMENT ON COLUMN public.profiles.monthly_token_limit IS 'Maximum tokens allowed per month based on plan';
COMMENT ON COLUMN public.profiles.billing_period_start IS 'Start of current billing period';
COMMENT ON COLUMN public.profiles.billing_period_end IS 'End of current billing period (resets monthly)';
