# 🔒 Security Guide - Code Insight

## ⚠️ CRITICAL: Environment Variables & Secrets Management

**NEVER commit credentials to Git!** All sensitive information must be stored in `.env` files which are gitignored.

---

## 🚨 What We Fixed

### **Security Issue Found:**
- ❌ Hardcoded API keys in `config.py`
- ❌ Real credentials in `.env.example` files
- ❌ Exposed OpenRouter, Supabase, MongoDB, and Redis credentials

### **Security Fixes Applied:**
- ✅ Removed all hardcoded credentials from `config.py`
- ✅ Updated all `.env.example` files with placeholders
- ✅ Added proper `.gitignore` rules
- ✅ Created this security guide

---

## 📋 How to Set Up Environment Variables

### **Step 1: Copy Example Files**

For each service, copy the `.env.example` to `.env`:

```bash
# Root
cp .env.example .env

# Frontend
cp frontend/.env.example frontend/.env.local

# Java API
cp backend/java-api/.env.example backend/java-api/.env

# Python Worker
cp backend/python-worker/.env.example backend/python-worker/.env
```

### **Step 2: Fill In Your Actual Credentials**

Edit each `.env` file and replace placeholders with your actual values:

```bash
# .env files should look like this:
OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_KEY_HERE
SUPABASE_URL=https://your-project.supabase.co
MONGODB_URI=mongodb+srv://user:pass@your-cluster.mongodb.net/
REDIS_URL=rediss://default:password@your-redis.upstash.io:6379
```

### **Step 3: Verify .gitignore**

Ensure your `.env` files are **NOT** tracked by Git:

```bash
git status
# Should NOT show any .env files
```

---

## 🔐 Credentials You Need

### **1. OpenRouter API Key**
- **Where**: https://openrouter.ai/keys
- **Variable**: `OPENROUTER_API_KEY`
- **Format**: `sk-or-v1-...`

### **2. Supabase**
- **Where**: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
- **Variables**:
  - `SUPABASE_URL`: Your project URL
  - `SUPABASE_ANON_KEY`: Public anon key (safe for frontend)
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (backend only, NEVER expose to frontend!)

### **3. MongoDB Atlas**
- **Where**: https://cloud.mongodb.com
- **Variable**: `MONGODB_URI`
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/`

### **4. Upstash Redis**
- **Where**: https://console.upstash.com
- **Variable**: `REDIS_URL`
- **Format**: `rediss://default:password@host.upstash.io:6379`

---

## 🚫 What NOT to Do

### **NEVER:**
- ❌ Commit `.env` files to Git
- ❌ Hardcode credentials in source code
- ❌ Share credentials in public repositories
- ❌ Put real credentials in `.env.example` files
- ❌ Commit `CREDENTIALS.md` (it's gitignored)
- ❌ Post credentials in issues or pull requests
- ❌ Share service role keys in frontend code

### **ALWAYS:**
- ✅ Use `.env` files for local development
- ✅ Use environment variables in production (Vercel, Render)
- ✅ Keep `.env.example` files with placeholders only
- ✅ Rotate credentials if accidentally exposed
- ✅ Use separate credentials for dev/staging/production

---

## 🌐 Production Deployment (Vercel & Render)

### **Vercel (Frontend)**
1. Go to Project Settings → Environment Variables
2. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`
3. **Never** add service role keys to frontend!

### **Render (Backend Services)**
1. For each service (Java API, Python Worker):
2. Go to Environment → Add Environment Variable
3. Add all required variables from `.env.example`
4. Click "Save Changes"

---

## 🔄 If Credentials Are Exposed

### **Immediate Actions:**

1. **Rotate ALL exposed credentials immediately**:
   - OpenRouter: Generate new API key
   - Supabase: Rotate service role key
   - MongoDB: Change password
   - Redis: Reset password

2. **Update everywhere**:
   - Local `.env` files
   - Vercel environment variables
   - Render environment variables

3. **Verify**:
   - Check Git history for leaked credentials
   - Use tools like `git-secrets` or `truffleHog`

---

## ✅ Security Checklist

Before every commit:
- [ ] No `.env` files in `git status`
- [ ] No hardcoded credentials in code
- [ ] All `.env.example` files have placeholders only
- [ ] CREDENTIALS.md is not tracked (gitignored)

Before deployment:
- [ ] Environment variables set in Vercel
- [ ] Environment variables set in Render
- [ ] No credentials in logs
- [ ] Service role keys only in backend

---

## 📝 Best Practices

### **1. Principle of Least Privilege**
- Use **anon keys** for frontend (limited access)
- Use **service role keys** for backend only (full access)

### **2. Separate Environments**
- Dev: Use separate credentials
- Staging: Use separate credentials
- Production: Use separate credentials with stricter access

### **3. Regular Rotation**
- Rotate credentials every 90 days
- Rotate immediately if team member leaves
- Rotate if credentials are suspected to be compromised

### **4. Monitoring**
- Enable alerts for unusual API usage
- Monitor for unauthorized access attempts
- Track credential usage

---

## 🆘 Emergency Contact

If you accidentally commit credentials:

1. **Immediately rotate all exposed credentials**
2. **Force push to remove from history** (if recent):
   ```bash
   git reset HEAD~1
   git push --force
   ```
3. **Contact your team immediately**
4. **Monitor for unauthorized usage**

---

## 📚 Additional Resources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Render Environment Variables](https://render.com/docs/environment-variables)

---

**Remember**: Security is not a one-time setup, it's an ongoing practice! 🔒
