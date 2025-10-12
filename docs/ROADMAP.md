# Code Insight - 4-Day Development Roadmap

## Day 1: Infrastructure Setup (TODAY) ✅

### Morning (4 hours)
- [x] Create project structure
- [x] Set up Next.js frontend
- [x] Set up Java API (Quarkus)
- [x] Set up Python FastAPI worker
- [x] Create Docker configurations
- [x] Set up GitHub Actions CI/CD

### Afternoon (4 hours)
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend services to Render
- [ ] Configure Redis (Upstash)
- [ ] Test end-to-end connectivity
- [ ] Set up environment variables

**Deliverables**: All services deployed and accessible

---

## Day 2: Core Backend Services

### Morning (4 hours)
- [ ] Implement Java API endpoints:
  - POST `/api/review` - Create review job
  - GET `/api/job/:id` - Get job status
  - POST `/api/auth/login` - Supabase auth integration
  - GET `/api/whoami` - User info & quotas
- [ ] Set up Redis connection for caching
- [ ] Implement job queue (Redis Streams)
- [ ] JWT validation middleware

### Afternoon (4 hours)
- [ ] Connect to MongoDB:
  - Users collection
  - Jobs collection
  - Repos collection
- [ ] Connect to Supabase:
  - Auth integration
  - Storage setup
- [ ] Implement rate limiting (Redis token bucket)
- [ ] Add health checks and monitoring endpoints

**Deliverables**: Functional API with auth, database, and queue

---

## Day 3: AI Integration & Core Features

### Morning (4 hours)
- [ ] Complete Claude Sonnet 4.5 integration:
  - Code review prompt system
  - Debug Doctor prompts
  - Architecture generator prompts
- [ ] Implement prompt caching (Redis)
- [ ] Token budgeting system:
  - Per-user token tracking
  - Soft throttling logic
  - Cost calculation

### Afternoon (4 hours)
- [ ] Set up Supabase pgvector:
  - Embeddings table
  - Vector indexing
  - Semantic search queries
- [ ] Implement Python worker services:
  - Process review jobs
  - Run linters/static analysis
  - Call Claude API
  - Post-process results
- [ ] Job status updates and notifications

**Deliverables**: Full AI-powered code review and debugging

---

## Day 4: Frontend & Polish

### Morning (4 hours)
- [ ] Build Next.js dashboard:
  - Login/signup page
  - Dashboard home
  - Code review submission form
  - Job status page
  - Results display with syntax highlighting
- [ ] WebSocket integration for real-time updates
- [ ] User profile & quota display

### Afternoon (3 hours)
- [ ] VS Code extension scaffold:
  - Basic extension structure
  - API key configuration
  - "Review File" command
  - Display diagnostics
- [ ] Testing:
  - End-to-end user flow
  - API endpoint tests
  - Claude integration tests

### Evening (1 hour)
- [ ] Final deployment
- [ ] Documentation review
- [ ] Demo preparation

**Deliverables**: Complete working product with frontend, backend, and VS Code extension

---

## Post-Launch (Week 2+)

### Week 2: Polish & Testing
- [ ] User feedback integration
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Improve prompts based on results

### Week 3: Advanced Features
- [ ] Batch review support
- [ ] GitHub integration (webhooks)
- [ ] PR comment bot
- [ ] Architecture diagram generator

### Week 4: Scaling
- [ ] Implement advanced caching strategies
- [ ] Add monitoring (Grafana)
- [ ] Load testing with k6
- [ ] Optimize token usage

---

## Success Metrics

### Day 1
- All services deployed and returning 200 OK

### Day 2
- Can create a job and retrieve its status
- Auth flow works end-to-end

### Day 3
- Can submit code and get Claude review back
- Token budgeting works correctly

### Day 4
- User can login, submit code, see results
- VS Code extension can communicate with API

---

## Critical Path Items

1. **OpenRouter API** - Must work for AI features
2. **Supabase Auth** - Required for user management
3. **MongoDB** - Required for job storage
4. **Redis** - Required for caching and queues
5. **Vercel/Render** - Required for deployment

---

## Risk Mitigation

### Technical Risks
- **Claude API rate limits**: Implement aggressive caching
- **Cold start times**: Use warm-up pings
- **Token costs**: Enforce strict budgets from day 1

### Scope Risks
- **Feature creep**: Stick to MVP for 4 days
- **Time overruns**: Cut VS Code extension if needed

---

## Daily Standup Questions

1. What did you complete yesterday?
2. What are you working on today?
3. Any blockers?

---

## Definition of Done

- [ ] All core features working
- [ ] Deployed to production
- [ ] Documentation complete
- [ ] Ready for user testing
