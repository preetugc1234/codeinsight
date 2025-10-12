# Code Insight 🚀

**AI-Powered Code Review, Debugging & Architecture System**

Built with Claude Sonnet 4.5, designed for 100K+ concurrent users.

## 🏗️ Architecture

```
Frontend (Next.js)     → Vercel
Java API (Quarkus)     → Render
Python FastAPI Worker  → Render
Redis (Upstash)        → Serverless
Supabase              → Auth, Storage, pgvector
MongoDB Atlas         → Code snapshots & metadata
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Java 17+
- Python 3.11+
- Docker

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### Java API
```bash
cd backend/java-api
./mvnw quarkus:dev
```

### Python Worker
```bash
cd backend/python-worker
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📦 Deployment

### Vercel (Frontend)
```bash
cd frontend
vercel --prod
```

### Render (Backend Services)
- Push to GitHub
- Connect Render to your repo
- Deploy java-api and python-worker as separate services

## 🔐 Environment Variables

See `.env.example` files in each service directory.

## 📊 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **API Gateway**: Java (Quarkus Reactive)
- **AI Orchestrator**: Python (FastAPI) + Claude Sonnet 4.5
- **Auth**: Supabase
- **Vector DB**: Supabase (pgvector)
- **Cache/Queue**: Redis (Upstash)
- **Database**: MongoDB Atlas
- **CI/CD**: GitHub Actions

## 📝 License

MIT License
