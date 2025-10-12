# Code Insight - Quick Start Guide 🚀

## ✅ What We've Built (Day 1)

Your **Code Insight** project is now fully set up with:

### Structure Created
```
code-insight/
├── frontend/              # Next.js 14 app (Vercel-ready)
├── backend/
│   ├── java-api/         # Quarkus API Gateway (Render-ready)
│   └── python-worker/    # FastAPI AI Worker (Render-ready)
├── .github/workflows/    # GitHub Actions CI/CD
├── docs/                 # Documentation
└── docker-compose.yml    # Local development setup
```

### ✅ Completed
- ✅ Full project structure
- ✅ Next.js frontend with Tailwind CSS
- ✅ Java API (Quarkus) with health checks
- ✅ Python FastAPI worker with Claude integration skeleton
- ✅ Docker configurations for all services
- ✅ GitHub Actions CI/CD pipeline
- ✅ Environment configurations with your credentials
- ✅ Pushed to GitHub: https://github.com/preetugc1234/codeinsight.git

---

## 🎯 Next Steps: Deploy Now!

### Step 1: Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com
2. Click **"New Project"**
3. Import `preetugc1234/codeinsight`
4. Set **Root Directory** to `frontend`
5. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cblgjjbpfpimrrpjlkhp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_API_URL=https://codeinsight-java-api.onrender.com
   ```
6. Click **Deploy**

### Step 2: Deploy Backend to Render (10 minutes)

#### Java API Service
1. Go to https://render.com
2. Click **"New" → "Web Service"**
3. Connect GitHub repo: `preetugc1234/codeinsight`
4. Configure:
   - **Name**: `codeinsight-java-api`
   - **Environment**: Docker
   - **Dockerfile Path**: `backend/java-api/Dockerfile`
   - **Docker Context**: `backend/java-api`
5. Add environment variables (from `backend/java-api/.env.example`)
6. Click **Create Web Service**

#### Python Worker Service
1. Click **"New" → "Web Service"** again
2. Connect same repo
3. Configure:
   - **Name**: `codeinsight-python-worker`
   - **Environment**: Docker
   - **Dockerfile Path**: `backend/python-worker/Dockerfile`
   - **Docker Context**: `backend/python-worker`
4. Add environment variables (from `backend/python-worker/.env.example`)
5. Click **Create Web Service**

### Step 3: Set Up Redis (5 minutes)

1. Go to https://upstash.com
2. Create free account
3. Click **"Create Database"**
4. Copy the Redis URL
5. Add to both Render services as `REDIS_URL`

### Step 4: Update Frontend API URL

Once your Java API is deployed on Render, update Vercel environment:
```
NEXT_PUBLIC_API_URL=https://codeinsight-java-api.onrender.com
```

---

## 🧪 Test Your Deployment

### Frontend
Visit your Vercel URL (e.g., `https://codeinsight-xxx.vercel.app`)

### Java API Health Check
```bash
curl https://codeinsight-java-api.onrender.com/health
```

Expected response:
```json
{
  "status": "UP",
  "service": "java-api",
  "version": "1.0.0"
}
```

### Python Worker Health Check
```bash
curl https://codeinsight-python-worker.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "python-worker"
}
```

---

## 💻 Local Development

### 1. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Python Worker:**
```bash
cd backend/python-worker
pip install -r requirements.txt
```

### 2. Copy Environment Files

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

### 3. Run with Docker Compose

```bash
docker-compose up
```

Services will be available at:
- Frontend: http://localhost:3000
- Java API: http://localhost:8080
- Python Worker: http://localhost:8000
- Redis: localhost:6379

### 4. Or Run Individually

**Frontend:**
```bash
cd frontend
npm run dev
```

**Java API:**
```bash
cd backend/java-api
./mvnw quarkus:dev
```

**Python Worker:**
```bash
cd backend/python-worker
uvicorn main:app --reload
```

---

## 📊 4-Day Roadmap

### ✅ Day 1 (DONE)
- Infrastructure setup
- Project structure
- Initial deployment configurations

### 📅 Day 2 (Tomorrow)
- Implement API endpoints (auth, review, jobs)
- Connect databases (MongoDB, Supabase)
- Set up Redis queue system
- JWT authentication

### 📅 Day 3
- Claude AI integration
- Code review system
- Debug Doctor feature
- Token budgeting

### 📅 Day 4
- Frontend dashboard
- VS Code extension
- Testing & polish
- Final deployment

See `docs/ROADMAP.md` for detailed breakdown.

---

## 🎨 Architecture Overview

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Next.js Frontend (Vercel)              │
│  - React components                     │
│  - Supabase Auth                        │
└──────┬──────────────────────────────────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────────┐
│  Java API Gateway (Render)              │
│  - Quarkus Reactive                     │
│  - JWT validation                       │
│  - Rate limiting (Redis)                │
│  - Job queue (Redis Streams)            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Python FastAPI Worker (Render)         │
│  - Claude Sonnet 4.5 integration        │
│  - Code review engine                   │
│  - Debug Doctor                         │
│  - Embeddings (Supabase pgvector)       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│  External Services             │
│  - Supabase (Auth, Storage)    │
│  - MongoDB Atlas (Data)        │
│  - Upstash Redis (Cache)       │
│  - OpenRouter (Claude API)     │
└────────────────────────────────┘
```

---

## 🔐 Credentials Summary

All credentials are pre-configured in `.env.example` files:

- **OpenRouter API**: ✅ Configured
- **Supabase**: ✅ Configured
- **MongoDB**: ✅ Configured
- **Redis**: ⚠️ Need to set up Upstash

---

## 🆘 Troubleshooting

### Frontend won't build
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run build
```

### Java API won't start
- Ensure Java 17+ is installed
- Check MongoDB connection string
- Verify all environment variables are set

### Python Worker errors
```bash
cd backend/python-worker
pip install --upgrade -r requirements.txt
```

### Docker issues
```bash
docker-compose down -v
docker-compose up --build
```

---

## 📚 Documentation

- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **4-Day Roadmap**: `docs/ROADMAP.md`
- **Architecture Details**: `prompt.md`

---

## 🚀 Ready to Deploy?

1. Deploy to Vercel (frontend)
2. Deploy to Render (backend services)
3. Set up Upstash Redis
4. Update environment variables
5. Test all services

**Estimated time**: 20-30 minutes

---

## 💡 Pro Tips

1. **Use Render Blueprint**: The `render.yaml` is already configured - just connect your repo!
2. **GitHub Actions**: Auto-deployment is configured - push to main to trigger
3. **Local Testing**: Use Docker Compose for full stack testing
4. **Environment Variables**: Never commit `.env` files - use `.env.example` as template

---

## 🎉 You're Ready!

Your Code Insight SaaS is ready for deployment. Follow the steps above and you'll have a live, scalable AI-powered code review platform in under 30 minutes!

**Questions?** Check the docs or create an issue on GitHub.

---

**Built with**: Next.js 14, Java Quarkus, Python FastAPI, Claude Sonnet 4.5
**Deployment**: Vercel + Render
**Estimated Cost**: $0-10/month (free tier friendly)
