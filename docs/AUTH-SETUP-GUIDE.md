# Authentication Setup Guide for Code Insight

## Overview
Complete Supabase authentication system with email/password and OAuth (Google, GitHub).

---

## ✅ What Has Been Implemented

### 1. **Authentication System**
- ✅ Supabase client configuration (`frontend/src/lib/supabase.ts`)
- ✅ Zustand auth store for state management (`frontend/src/store/authStore.ts`)
- ✅ Auth provider component for global auth state
- ✅ Protected route wrapper component
- ✅ Session persistence and auto-refresh

### 2. **Pages Created**
- ✅ `/signup` - Signup page with first name, last name, email, password
- ✅ `/login` - Login page with email/password and OAuth buttons
- ✅ `/auth/callback` - OAuth callback handler
- ✅ `/dashboard` - Protected dashboard page

### 3. **Authentication Methods**
- ✅ Email/Password signup
- ✅ Email/Password login
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ Automatic profile creation for OAuth users

---

## 🔧 Setup Steps for You

### Step 1: Set Up Google OAuth

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select existing):
   - Click project dropdown → "New Project"
   - Name: `Code Insight`
   - Click "Create"

3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search "Google+ API"
   - Click "Enable"

4. **Create OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External"
   - Fill in:
     - **App name**: `Code Insight`
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click "Save and Continue" (skip Scopes)
   - **Test users**: Add your email
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - **Application type**: Web application
   - **Name**: `Code Insight Web Client`
   - **Authorized JavaScript origins**:
     - `https://codeinsight4.vercel.app`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `https://cblgjjbpfpimrrpjlkhp.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`
   - Click "Create"
   - **COPY the Client ID and Client Secret**

---

### Step 2: Set Up GitHub OAuth

1. **Go to GitHub Settings**: https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - **Application name**: `Code Insight`
   - **Homepage URL**: `https://codeinsight4.vercel.app`
   - **Authorization callback URL**: `https://cblgjjbpfpimrrpjlkhp.supabase.co/auth/v1/callback`
   - **Application description**: `AI-powered code review platform`
4. Click "Register application"
5. **COPY the Client ID**
6. Click "Generate a new client secret"
7. **COPY the Client Secret** (you can only see it once!)

---

### Step 3: Configure Supabase Dashboard

**Go to**: https://supabase.com/dashboard/project/cblgjjbpfpimrrpjlkhp

#### A. Enable Email/Password Authentication
1. Go to **Authentication** → **Providers**
2. Find **Email** provider (should be enabled by default)
3. Make sure these are enabled:
   - ✅ Enable email provider
   - ✅ Confirm email (optional, recommended)
   - ✅ Enable email signups

#### B. Configure Google OAuth
1. In **Authentication** → **Providers**
2. Find **Google** and click on it
3. Toggle **Enable Sign in with Google** to ON
4. Paste your **Google Client ID**
5. Paste your **Google Client Secret**
6. Click **Save**

#### C. Configure GitHub OAuth
1. In **Authentication** → **Providers**
2. Find **GitHub** and click on it
3. Toggle **Enable Sign in with GitHub** to ON
4. Paste your **GitHub Client ID**
5. Paste your **GitHub Client Secret**
6. Click **Save**

#### D. Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. **Site URL**: `https://codeinsight4.vercel.app`
3. **Redirect URLs** (add both):
   - `https://codeinsight4.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Click **Save**

---

### Step 4: Create Profiles Table in Supabase

1. Go to **SQL Editor** in Supabase dashboard
2. Open the file: `docs/supabase-profiles-migration.sql`
3. Copy the entire SQL content
4. Paste it into the SQL Editor
5. Click "Run" to execute

This creates:
- `profiles` table with RLS (Row Level Security)
- Policies for secure data access
- Indexes for performance
- Triggers for auto-updating timestamps

---

### Step 5: Update Vercel Environment Variables

**Go to**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Already configured** (no changes needed):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_API_URL`
- ✅ `NEXT_PUBLIC_WS_URL`

**Note**: The code already uses the Supabase credentials you provided earlier.

---

## 🧪 Testing the Authentication

### Test Email/Password Signup:
1. Go to: `https://codeinsight4.vercel.app/signup`
2. Fill in first name, last name, email, password
3. Click "Create account"
4. Should redirect to dashboard

### Test Email/Password Login:
1. Go to: `https://codeinsight4.vercel.app/login`
2. Enter email and password
3. Click "Sign in"
4. Should redirect to dashboard

### Test Google OAuth:
1. Go to: `https://codeinsight4.vercel.app/login`
2. Click "Continue with Google"
3. Select your Google account
4. Should redirect to dashboard

### Test GitHub OAuth:
1. Go to: `https://codeinsight4.vercel.app/login`
2. Click "Continue with GitHub"
3. Authorize the app
4. Should redirect to dashboard

### Test Protected Routes:
1. Try accessing: `https://codeinsight4.vercel.app/dashboard` (without being logged in)
2. Should redirect to `/login`
3. After logging in, should show dashboard with your profile

---

## 📁 Files Created

### Frontend Components:
- `frontend/src/lib/supabase.ts` - Supabase client configuration
- `frontend/src/store/authStore.ts` - Zustand auth state management
- `frontend/src/components/AuthProvider.tsx` - Auth provider wrapper
- `frontend/src/components/ProtectedRoute.tsx` - Protected route wrapper

### Pages:
- `frontend/src/app/signup/page.tsx` - Signup page
- `frontend/src/app/login/page.tsx` - Login page
- `frontend/src/app/auth/callback/page.tsx` - OAuth callback handler
- `frontend/src/app/dashboard/page.tsx` - Protected dashboard

### Database:
- `docs/supabase-profiles-migration.sql` - Profiles table schema

---

## 🔐 Security Features

- ✅ Row Level Security (RLS) on profiles table
- ✅ JWT-based authentication via Supabase
- ✅ Secure session storage with auto-refresh
- ✅ Protected routes with authentication checks
- ✅ HTTPS-only OAuth callbacks
- ✅ Password validation (min 6 characters)
- ✅ Email validation

---

## 🚀 What's Next

After you complete the setup steps above, you'll have:
- ✅ Working email/password authentication
- ✅ Google OAuth sign-in
- ✅ GitHub OAuth sign-in
- ✅ User profiles stored in Supabase
- ✅ Protected dashboard page
- ✅ Session persistence across page reloads

**Next tasks from ROADMAP.md**:
- JWT validation in Java API
- Connect frontend auth with backend
- Implement code review submission
- Real-time job status updates via WebSocket

---

## 📝 Notes

1. **OAuth Apps in Google**: They require verification if you plan to have 100+ users. For testing, keep it in "Testing" mode.
2. **Supabase Plans**: Free tier includes 50,000 monthly active users, which is perfect for starting.
3. **Environment Variables**: Already configured in Vercel, but you can update them anytime in the Vercel dashboard.
4. **Local Development**: To test locally, use `http://localhost:3000` URLs in your OAuth configurations.

---

## 🐛 Troubleshooting

### Issue: "Redirect URI mismatch" error
**Solution**: Make sure the callback URL in Google/GitHub OAuth settings exactly matches:
`https://cblgjjbpfpimrrpjlkhp.supabase.co/auth/v1/callback`

### Issue: "Profile not found" error
**Solution**: Make sure you ran the SQL migration in Supabase SQL Editor.

### Issue: OAuth buttons not working
**Solution**: Check Supabase dashboard → Authentication → Providers to ensure Google and GitHub are enabled and credentials are saved.

---

## ✅ Checklist for You

- [ ] Create Google OAuth credentials in Google Cloud Console
- [ ] Create GitHub OAuth app in GitHub Settings
- [ ] Configure Google OAuth in Supabase dashboard
- [ ] Configure GitHub OAuth in Supabase dashboard
- [ ] Configure redirect URLs in Supabase
- [ ] Run SQL migration in Supabase SQL Editor
- [ ] Test email/password signup
- [ ] Test email/password login
- [ ] Test Google OAuth sign-in
- [ ] Test GitHub OAuth sign-in
- [ ] Verify protected routes work correctly

Once you complete these steps, reply with: **"Auth setup complete"** and I'll move on to the next tasks!
