# 🚀 Production Deployment Guide - UPDATED

## ✅ All Production URLs Configured!

Your services are now configured to use production endpoints:

### Production URLs:
- **Frontend**: https://codeinsight4.vercel.app
- **Java API Gateway**: https://codeinsight-java-api.onrender.com
- **Python Worker**: https://codeinsight-python-worker.onrender.com

---

## 📋 What Was Fixed

### Problem:
- Services were using localhost URLs
- API key generation failed
- Extension couldn't authenticate
- Routes not working in production

### Solution Applied:
✅ Java API now points to production Python worker
✅ Frontend now points to production Java API
✅ Extension now points to production Java API
✅ All code committed and pushed (commit: 6bd3c17)

---

## 🚀 Deployment Steps

### Step 1: Deploy Java API to Render

#### Option A: Auto-Deploy (Recommended)
1. Go to Render dashboard: https://dashboard.render.com
2. Find your `codeinsight-java-api` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build to complete (~5 minutes)

#### Option B: Set Environment Variable
If you want to override the Python worker URL:
1. Go to Render dashboard
2. Click `codeinsight-java-api` service
3. Go to "Environment" tab
4. Add variable:
   - **Key**: `PYTHON_WORKER_URL`
   - **Value**: `https://codeinsight-python-worker.onrender.com`
5. Save and redeploy

### Step 2: Deploy Python Worker to Render

1. Go to Render dashboard
2. Find `codeinsight-python-worker` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment (~3 minutes)

### Step 3: Deploy Frontend to Vercel

#### Update Environment Variables in Vercel:
1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Find `codeinsight4` project
3. Go to "Settings" → "Environment Variables"
4. Update these variables:
   ```
   NEXT_PUBLIC_API_URL = https://codeinsight-java-api.onrender.com
   NEXT_PUBLIC_WS_URL = wss://codeinsight-java-api.onrender.com/ws
   ```
5. Click "Save"
6. Go to "Deployments" tab
7. Click "Redeploy" on latest deployment

**OR** just push to main (Vercel auto-deploys):
```bash
# Already done! Just wait for Vercel to deploy
```

### Step 4: Publish Extension Update

Your extension v1.0.1 is ready but needs re-authentication:

#### Re-login to VS Code Marketplace:
```bash
# Login again with fresh PAT token
npx vsce login code-insight

# When prompted, paste your PAT token from Azure DevOps
# (Go to: https://dev.azure.com → User Settings → Personal Access Tokens)
```

#### Then publish:
```bash
cd vscode-extension
npx vsce publish
```

---

## ✅ Verification Steps

### Test 1: Check Services are Running

```bash
# Test Java API
curl https://codeinsight-java-api.onrender.com/health
# Should return: {"status": "healthy"}

# Test Python Worker
curl https://codeinsight-python-worker.onrender.com/health
# Should return: {"status": "healthy", "service": "python-worker"}

# Test Frontend
curl https://codeinsight4.vercel.app
# Should return: HTML page
```

### Test 2: Test API Key Generation

1. Go to: https://codeinsight4.vercel.app/dashboard/settings
2. Sign in
3. Click "Regenerate" button
4. Should see: "✓ New API key generated and copied to clipboard!"
5. API key format: `sk_ci_abc123...`

### Test 3: Test Authentication Endpoint

```bash
# Get your API key from dashboard first, then:
curl https://codeinsight-java-api.onrender.com/api/auth/whoami \
  -H "Authorization: Bearer sk_ci_YOUR_KEY_HERE"

# Should return:
# {
#   "success": true,
#   "user_id": "...",
#   "email": "...",
#   "plan": "trial",
#   "is_authenticated": true,
#   "auth_method": "api_key"
# }
```

### Test 4: Test Extension in Cursor

1. Open Cursor IDE
2. Press `Ctrl+Shift+X` (Extensions)
3. Search `code-insight2`
4. Update to v1.0.1 (or wait for auto-update)
5. Press `Ctrl+Shift+P`
6. Type "Code Insight: Set API Key"
7. Paste API key from dashboard
8. Should see: "✓ API key saved successfully"
9. Open any code file
10. Press `Ctrl+Shift+P` → "Code Insight: Review Current File"
11. Should work! 🎉

---

## 🔧 Environment Variables Summary

### Java API (Render)
```properties
PYTHON_WORKER_URL=https://codeinsight-python-worker.onrender.com
MONGODB_URI=mongodb+srv://...
REDIS_PASSWORD=...
```

### Python Worker (Render)
```bash
OPENROUTER_API_KEY=sk-or-v1-...
SUPABASE_URL=https://cblgjjbpfpimrrpjlkhp.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://cblgjjbpfpimrrpjlkhp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_API_URL=https://codeinsight-java-api.onrender.com
NEXT_PUBLIC_WS_URL=wss://codeinsight-java-api.onrender.com/ws
```

---

## 📦 Extension Publishing

### Create New PAT Token (if expired):

1. Go to: https://dev.azure.com
2. Click your profile → Personal Access Tokens
3. Click "New Token"
4. Settings:
   - **Name**: `vscode-marketplace-2025`
   - **Organization**: Select your org
   - **Expiration**: 90 days
   - **Scopes**: Show all scopes → ✅ **Marketplace (Manage)**
5. Click "Create"
6. **Copy token immediately!**

### Publish Extension:

```bash
# Login with new PAT
cd vscode-extension
npx vsce login code-insight
# Paste PAT token when prompted

# Publish v1.0.1
npx vsce publish

# Output:
# ✅ Successfully published code-insight2@1.0.1!
```

### Users Auto-Update:
- VS Code/Cursor checks for updates every few hours
- Users will auto-update to v1.0.1
- New installs get v1.0.1 immediately

---

## 🎯 Final Checklist

Before announcing your app is live:

- [ ] Java API deployed on Render
- [ ] Python Worker deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables updated in all services
- [ ] `/health` endpoints return 200 OK
- [ ] API key generation works from dashboard
- [ ] `/api/auth/whoami` returns valid response
- [ ] Extension v1.0.1 published to marketplace
- [ ] Test full flow: signup → generate key → install extension → review code
- [ ] All services use HTTPS (no http://)
- [ ] WebSocket uses WSS (not WS)

---

## 🚀 Architecture (Production)

```
User
  ↓
VS Code Extension v1.0.1
  ↓ HTTPS
Java API Gateway (Render)
https://codeinsight-java-api.onrender.com
  ↓ HTTPS
Python Worker (Render)
https://codeinsight-python-worker.onrender.com
  ↓
Supabase (Auth, API Keys)
MongoDB (Jobs)
Redis (Cache, Queue)
```

---

## ⚡ Quick Deploy Commands

```bash
# 1. Code is already pushed (commit: 6bd3c17)
git log --oneline -1
# Should show: "FIX: Production URLs..."

# 2. Trigger Render deployments
# Go to Render dashboard → Manual Deploy (both services)

# 3. Trigger Vercel deployment
# Go to Vercel dashboard → Redeploy
# OR just wait (auto-deploys from main branch)

# 4. Publish extension
cd vscode-extension
npx vsce login code-insight  # If needed
npx vsce publish
```

---

## 🎉 You're Live!

Once all services are deployed and extension is published:

1. ✅ Users can sign up at: https://codeinsight4.vercel.app
2. ✅ Users can generate API keys
3. ✅ Users can install extension: `code-insight2`
4. ✅ Users can review code with AI
5. ✅ Everything works end-to-end!

---

## 📞 Support

If you encounter issues:

1. **Check Render Logs**:
   - Go to Render dashboard
   - Click service
   - View "Logs" tab

2. **Check Vercel Logs**:
   - Go to Vercel dashboard
   - Click deployment
   - View logs

3. **Test Endpoints**:
   ```bash
   # Test each service individually
   curl https://codeinsight-java-api.onrender.com/health
   curl https://codeinsight-python-worker.onrender.com/health
   ```

4. **Check Extension Logs**:
   - In VS Code/Cursor: Help → Toggle Developer Tools
   - Go to Console tab
   - Look for errors

---

**Next**: Deploy all services to Render/Vercel, then publish extension v1.0.1! 🚀

