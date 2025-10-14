from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import asyncio
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from services.claude_service import claude_service
from services.prompt_service import prompt_service
from services.cache_service import cache_service
from services.mongodb_service import mongodb_service
from services.queue_service import queue_service
from services.review_pipeline import review_pipeline

load_dotenv()

# Background task for job queue consumer
consumer_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    Initialize all services and start job queue consumer
    """
    global consumer_task

    # Startup
    print("\n" + "="*60)
    print("🚀 Starting Code Insight AI Worker")
    print("="*60 + "\n")

    # Connect to all services
    await cache_service.connect()
    await mongodb_service.connect()
    await queue_service.connect()

    # Start job queue consumer in background
    async def job_processor(job_data: Dict[str, Any]) -> bool:
        """Process jobs from queue"""
        job_type = job_data.get("type", "review")

        if job_type == "review":
            return await review_pipeline.process_review(job_data)
        elif job_type == "debug":
            return await review_pipeline.process_debug(job_data)
        else:
            print(f"⚠️  Unknown job type: {job_type}")
            return False

    # Start consumer task
    consumer_task = asyncio.create_task(
        queue_service.start_consumer(job_processor)
    )

    print("\n✅ All services started successfully!\n")

    yield

    # Shutdown
    print("\n" + "="*60)
    print("👋 Shutting down Code Insight AI Worker")
    print("="*60 + "\n")

    # Cancel consumer task
    if consumer_task:
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass

    # Disconnect services
    await queue_service.disconnect()
    await mongodb_service.disconnect()
    await cache_service.disconnect()

    print("✅ Shutdown complete\n")

app = FastAPI(
    title="Code Insight AI Worker",
    description="Python FastAPI worker for AI orchestration with Claude Sonnet 4.5",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ReviewRequest(BaseModel):
    repo_id: str
    file_path: str
    file_content: str
    language: str
    cursor_context: Optional[str] = None

class DebugRequest(BaseModel):
    file_name: str
    code: str
    error_log: Optional[str] = None

class ArchitectureRequest(BaseModel):
    user_request: str
    tech_stack: str
    scale: str
    database: str

@app.get("/")
async def root():
    return {
        "service": "python-worker",
        "status": "UP",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "python-worker"
    }

@app.post("/process-review")
async def process_review(request: ReviewRequest):
    """
    Process code review request using Claude Sonnet 4.5
    With caching and security checks
    """
    try:
        # 1. Security checks
        security_check = prompt_service.check_security_filters(request.file_content)
        if not security_check["safe"]:
            raise HTTPException(
                status_code=400,
                detail=f"Security check failed: {', '.join(security_check['issues'])}"
            )

        # 2. Generate cache key
        cache_key = cache_service.generate_cache_key(
            prompt=f"review_{request.language}_{request.file_path}",
            context=request.file_content
        )

        # 3. Check cache first
        cached_response = await cache_service.get(cache_key)
        if cached_response:
            return {
                "success": True,
                "cached": True,
                **cached_response
            }

        # 4. Call Claude for code review
        result = await claude_service.code_review(
            code=request.file_content,
            language=request.language,
            filename=request.file_path
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"AI service error: {result.get('error')}"
            )

        # 5. Cache the result
        ttl = prompt_service.get_cache_ttl("code_review")
        await cache_service.set(cache_key, result, ttl)

        return {
            "success": True,
            "cached": False,
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-debug")
async def process_debug(request: DebugRequest):
    """
    Debug Doctor - analyze and fix runtime errors
    With caching
    """
    try:
        # 1. Generate cache key
        cache_key = cache_service.generate_cache_key(
            prompt=f"debug_{request.file_name}",
            context=f"{request.code}||{request.error_log}"
        )

        # 2. Check cache first
        cached_response = await cache_service.get(cache_key)
        if cached_response:
            return {
                "success": True,
                "cached": True,
                **cached_response
            }

        # 3. Call Claude for debugging
        result = await claude_service.debug_doctor(
            filename=request.file_name,
            code=request.code,
            error_log=request.error_log or "No error log provided"
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"AI service error: {result.get('error')}"
            )

        # 4. Cache the result
        ttl = prompt_service.get_cache_ttl("debug")
        await cache_service.set(cache_key, result, ttl)

        return {
            "success": True,
            "cached": False,
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-architecture")
async def generate_architecture(request: ArchitectureRequest):
    """
    Generate system architecture design
    With caching
    """
    try:
        # 1. Generate cache key
        cache_key = cache_service.generate_cache_key(
            prompt=f"arch_{request.tech_stack}_{request.scale}",
            context=request.user_request
        )

        # 2. Check cache first
        cached_response = await cache_service.get(cache_key)
        if cached_response:
            return {
                "success": True,
                "cached": True,
                **cached_response
            }

        # 3. Call Claude for architecture generation
        result = await claude_service.generate_architecture(
            user_request=request.user_request,
            stack=request.tech_stack,
            scale=request.scale,
            database=request.database
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"AI service error: {result.get('error')}"
            )

        # 4. Cache the result
        ttl = prompt_service.get_cache_ttl("architecture")
        await cache_service.set(cache_key, result, ttl)

        return {
            "success": True,
            "cached": False,
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cache/stats")
async def get_cache_stats():
    """
    Get cache statistics
    """
    stats = await cache_service.get_stats()
    return stats

@app.post("/cache/clear")
async def clear_cache():
    """
    Clear all cached prompts (admin only)
    """
    deleted = await cache_service.clear_all_cache()
    return {
        "success": True,
        "deleted_count": deleted,
        "message": f"Cleared {deleted} cached entries"
    }

# ==================== JOB MANAGEMENT ENDPOINTS ====================

@app.post("/jobs/enqueue")
async def enqueue_job(
    user_id: str,
    job_type: str,
    file_path: Optional[str] = None,
    file_content: Optional[str] = None,
    language: Optional[str] = None,
    repo_id: Optional[str] = None
):
    """
    Enqueue a new job to Redis Streams
    Job will be picked up by worker pool
    """
    try:
        # Create job in MongoDB
        job_id = await mongodb_service.create_job(
            user_id=user_id,
            job_type=job_type,
            repo_id=repo_id,
            file_path=file_path,
            file_content=file_content,
            language=language
        )

        # Enqueue to Redis Streams
        job_data = {
            "job_id": job_id,
            "user_id": user_id,
            "type": job_type,
            "file_path": file_path,
            "file_content": file_content,
            "language": language,
            "repo_id": repo_id
        }

        message_id = await queue_service.enqueue_job(job_data)

        return {
            "success": True,
            "job_id": job_id,
            "message_id": message_id,
            "status": "enqueued"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """
    Get job status and results
    """
    job = await mongodb_service.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job

@app.get("/jobs/user/{user_id}")
async def get_user_jobs(user_id: str, limit: int = 50):
    """
    Get all jobs for a user
    """
    jobs = await mongodb_service.get_user_jobs(user_id, limit=limit)
    return {"jobs": jobs, "count": len(jobs)}

@app.get("/queue/info")
async def get_queue_info():
    """
    Get info about the job queue
    """
    info = await queue_service.get_stream_info()
    return info

@app.get("/stats")
async def get_system_stats():
    """
    Get overall system statistics
    """
    cache_stats = await cache_service.get_stats()
    queue_info = await queue_service.get_stream_info()

    return {
        "service": "python-worker",
        "cache": cache_stats,
        "queue": queue_info,
        "status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
