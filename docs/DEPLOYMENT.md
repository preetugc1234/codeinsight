# Code Insight - Deployment Guide

## Prerequisites

Before deployment, ensure you have:

1. GitHub account
2. Vercel account (free tier)
3. Render account (free tier)
4. Supabase project (already set up)
5. MongoDB Atlas cluster (already set up)
6. Redis instance (Upstash recommended for production)

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Code Insight setup"
git remote add origin https://github.com/preetugc1234/codeinsight.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Frontend to Vercel

### Option A: Vercel Dashboard
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `frontend`
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (will be your Render URL)
6. Deploy

### Option B: Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

## Step 3: Deploy Backend to Render

### Option A: Render Dashboard (Recommended)
1. Go to https://render.com
2. Create new "Web Service"
3. Connect your GitHub repository
4. Deploy Java API:
   - Name: `codeinsight-java-api`
   - Environment: Docker
   - Dockerfile path: `backend/java-api/Dockerfile`
   - Add environment variables from `.env.example`
5. Deploy Python Worker:
   - Name: `codeinsight-python-worker`
   - Environment: Docker
   - Dockerfile path: `backend/python-worker/Dockerfile`
   - Add environment variables from `.env.example`

### Option B: Render Blueprint
```bash
# render.yaml is already configured in the root directory
# Just connect your GitHub repo and Render will auto-deploy
```

## Step 4: Set Up Redis (Upstash)

1. Go to https://upstash.com
2. Create a new Redis database
3. Copy the connection URL
4. Update `REDIS_URL` in both Render services

## Step 5: Configure Environment Variables

Update your Vercel frontend with the deployed backend URLs:
```
NEXT_PUBLIC_API_URL=https://codeinsight-java-api.onrender.com
```

## Step 6: Test Deployment

1. **Frontend**: Visit your Vercel URL
2. **Java API**: `https://your-java-api.onrender.com/health`
3. **Python Worker**: `https://your-python-worker.onrender.com/health`

## GitHub Actions Auto-Deployment

The `.github/workflows/deploy.yml` is already configured to:
- Deploy frontend to Vercel on push to main
- Build and push Docker images to GitHub Container Registry
- Trigger Render redeployment

### Required GitHub Secrets

Add these to your GitHub repository settings:

```
VERCEL_TOKEN          # Get from Vercel dashboard
VERCEL_ORG_ID         # Get from Vercel settings
VERCEL_PROJECT_ID     # Get from Vercel project settings
```

## Architecture Overview (Deployed)

```
[User] → Vercel (Frontend) → Render (Java API) → Render (Python Worker)
                                    ↓                    ↓
                                  Redis              Claude API
                                    ↓                    ↓
                              Supabase            MongoDB Atlas
```

## Cost Breakdown (Free Tier)

- **Vercel**: Free for hobby projects
- **Render**: Free tier (2 services with 750 hours/month)
- **Supabase**: Free tier (500MB database, 1GB storage)
- **MongoDB Atlas**: Free tier (512MB storage)
- **Upstash Redis**: Free tier (10K commands/day)
- **OpenRouter**: Pay-per-use (~$0.05 per 1K tokens)

**Total Monthly Cost**: ~$0-10 depending on usage

## Scaling to Production

When ready to scale:
1. Upgrade Render to paid tier for better performance
2. Add Cloudflare for CDN and WAF
3. Set up Redis cluster for high availability
4. Enable MongoDB sharding
5. Implement rate limiting
6. Add monitoring (Grafana/Prometheus)

## Troubleshooting

### Frontend not connecting to API
- Check CORS settings in Java API
- Verify `NEXT_PUBLIC_API_URL` is correct

### Claude API errors
- Verify `OPENROUTER_API_KEY` is correct
- Check token budget limits

### Database connection errors
- Verify MongoDB URI format
- Check Supabase credentials
- Ensure Redis is accessible

## Support

For issues, check:
- GitHub Issues: https://github.com/preetugc1234/codeinsight/issues
- Documentation: /docs/
