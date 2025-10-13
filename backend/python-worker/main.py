from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from services.claude_service import claude_service
from services.prompt_service import prompt_service
from services.cache_service import cache_service

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup
    print("🚀 Starting Code Insight AI Worker...")
    await cache_service.connect()
    yield
    # Shutdown
    print("👋 Shutting down Code Insight AI Worker...")
    await cache_service.disconnect()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
