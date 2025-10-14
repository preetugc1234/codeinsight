"""
MongoDB Service for Jobs, Users, Repos, and Snapshots
Following prompt.md specifications for schema and indexes
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING
from typing import Dict, Any, Optional, List
from datetime import datetime
from config import settings
import uuid

class MongoDBService:
    """
    MongoDB service for managing jobs, users, repos, and snapshots
    Collections: jobs, users, repos, snapshots (as per prompt.md lines 200-278)
    """

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.jobs_collection = None
        self.users_collection = None
        self.repos_collection = None
        self.snapshots_collection = None

    async def connect(self):
        """Initialize MongoDB connection and create indexes"""
        try:
            self.client = AsyncIOMotorClient(settings.mongodb_uri)
            self.db = self.client[settings.mongodb_db]

            # Initialize collections
            self.jobs_collection = self.db["jobs"]
            self.users_collection = self.db["users"]
            self.repos_collection = self.db["repos"]
            self.snapshots_collection = self.db["snapshots"]

            # Create indexes
            await self._create_indexes()

            # Test connection
            await self.client.admin.command('ping')
            print("✅ MongoDB connected successfully")

        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            self.client = None

    async def _create_indexes(self):
        """
        Create indexes for all collections
        Following prompt.md best practices for query performance
        """
        try:
            # Jobs collection indexes
            jobs_indexes = [
                IndexModel([("job_id", ASCENDING)], unique=True, name="idx_job_id"),
                IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="idx_user_jobs"),
                IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="idx_status_time"),
                IndexModel([("type", ASCENDING), ("status", ASCENDING)], name="idx_type_status"),
            ]
            await self.jobs_collection.create_indexes(jobs_indexes)

            # Users collection indexes
            users_indexes = [
                IndexModel([("supabase_id", ASCENDING)], unique=True, name="idx_supabase_id"),
                IndexModel([("api_key", ASCENDING)], unique=True, sparse=True, name="idx_api_key"),
                IndexModel([("plan", ASCENDING)], name="idx_plan"),
            ]
            await self.users_collection.create_indexes(users_indexes)

            # Repos collection indexes
            repos_indexes = [
                IndexModel([("user_id", ASCENDING), ("repo_url", ASCENDING)], name="idx_user_repo"),
                IndexModel([("repo_hash", ASCENDING)], name="idx_repo_hash"),
            ]
            await self.repos_collection.create_indexes(repos_indexes)

            # Snapshots collection indexes
            snapshots_indexes = [
                IndexModel([("repo_id", ASCENDING), ("file_path", ASCENDING)], name="idx_repo_file"),
                IndexModel([("created_at", DESCENDING)], name="idx_created_time"),
            ]
            await self.snapshots_collection.create_indexes(snapshots_indexes)

            print("✅ MongoDB indexes created successfully")

        except Exception as e:
            print(f"⚠️  MongoDB index creation warning: {e}")

    async def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("🔌 MongoDB disconnected")

    # ==================== JOBS CRUD ====================

    async def create_job(
        self,
        user_id: str,
        job_type: str,
        repo_id: Optional[str] = None,
        file_path: Optional[str] = None,
        file_content: Optional[str] = None,
        language: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a new job
        Schema: job_id, user_id, type, status, results, tokens_used, created_at
        """
        job_id = str(uuid.uuid4())

        job_doc = {
            "job_id": job_id,
            "user_id": user_id,
            "type": job_type,  # "review", "debug", "architecture"
            "status": "pending",  # "pending", "processing", "completed", "failed"
            "repo_id": repo_id,
            "file_path": file_path,
            "file_content": file_content,
            "language": language,
            "results": None,
            "error": None,
            "tokens_used": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            },
            "estimated_cost": 0.0,
            "cache_hit": False,
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "completed_at": None
        }

        await self.jobs_collection.insert_one(job_doc)
        print(f"✅ Job created: {job_id} (type: {job_type})")

        return job_id

    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by ID"""
        job = await self.jobs_collection.find_one({"job_id": job_id})
        if job:
            job.pop("_id", None)  # Remove MongoDB internal ID
        return job

    async def update_job_status(
        self,
        job_id: str,
        status: str,
        results: Optional[Any] = None,
        error: Optional[str] = None
    ) -> bool:
        """Update job status and results"""
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow()
        }

        if results is not None:
            update_data["results"] = results

        if error is not None:
            update_data["error"] = error

        if status == "completed" or status == "failed":
            update_data["completed_at"] = datetime.utcnow()

        result = await self.jobs_collection.update_one(
            {"job_id": job_id},
            {"$set": update_data}
        )

        if result.modified_count > 0:
            print(f"✅ Job {job_id} updated to status: {status}")
            return True
        return False

    async def update_job_tokens(
        self,
        job_id: str,
        tokens_used: Dict[str, int],
        estimated_cost: float,
        cache_hit: bool = False
    ) -> bool:
        """Update job token usage and cost"""
        result = await self.jobs_collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "tokens_used": tokens_used,
                    "estimated_cost": estimated_cost,
                    "cache_hit": cache_hit,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return result.modified_count > 0

    async def get_user_jobs(
        self,
        user_id: str,
        limit: int = 50,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get jobs for a user"""
        query = {"user_id": user_id}

        if status:
            query["status"] = status

        cursor = self.jobs_collection.find(query).sort("created_at", DESCENDING).limit(limit)
        jobs = await cursor.to_list(length=limit)

        # Remove MongoDB _id from results
        for job in jobs:
            job.pop("_id", None)

        return jobs

    async def get_pending_jobs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get pending jobs for processing"""
        cursor = self.jobs_collection.find({"status": "pending"}).sort("created_at", ASCENDING).limit(limit)
        jobs = await cursor.to_list(length=limit)

        for job in jobs:
            job.pop("_id", None)

        return jobs

    # ==================== USERS CRUD ====================

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        user = await self.users_collection.find_one({"_id": user_id})
        return user

    async def get_user_by_supabase_id(self, supabase_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Supabase ID"""
        user = await self.users_collection.find_one({"supabase_id": supabase_id})
        return user

    async def create_user(
        self,
        supabase_id: str,
        email: str,
        plan: str = "lite",
        api_key: Optional[str] = None
    ) -> str:
        """Create a new user"""
        user_id = str(uuid.uuid4())

        user_doc = {
            "_id": user_id,
            "supabase_id": supabase_id,
            "email": email,
            "plan": plan,
            "api_key": api_key,
            "quota": {
                "tokens": settings.token_budget_lite if plan == "lite" else settings.token_budget_pro,
                "tokens_used": 0,
                "requests": 10000,
                "requests_used": 0
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        await self.users_collection.insert_one(user_doc)
        print(f"✅ User created: {user_id} (plan: {plan})")

        return user_id

    async def update_user_quota(
        self,
        user_id: str,
        tokens_used: int,
        requests_used: int = 1
    ) -> bool:
        """Update user quota usage"""
        result = await self.users_collection.update_one(
            {"_id": user_id},
            {
                "$inc": {
                    "quota.tokens_used": tokens_used,
                    "quota.requests_used": requests_used
                },
                "$set": {
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return result.modified_count > 0

    # ==================== REPOS CRUD ====================

    async def create_repo(
        self,
        user_id: str,
        repo_url: str,
        repo_hash: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new repo"""
        repo_id = str(uuid.uuid4())

        repo_doc = {
            "_id": repo_id,
            "user_id": user_id,
            "repo_url": repo_url,
            "repo_hash": repo_hash,
            "last_indexed": datetime.utcnow(),
            "metadata": metadata or {},
            "created_at": datetime.utcnow()
        }

        await self.repos_collection.insert_one(repo_doc)
        print(f"✅ Repo created: {repo_id}")

        return repo_id

    async def get_repo(self, repo_id: str) -> Optional[Dict[str, Any]]:
        """Get repo by ID"""
        repo = await self.repos_collection.find_one({"_id": repo_id})
        return repo

    # ==================== SNAPSHOTS CRUD ====================

    async def create_snapshot(
        self,
        repo_id: str,
        file_path: str,
        content: str,
        content_hash: str
    ) -> str:
        """Create a code snapshot"""
        snapshot_id = str(uuid.uuid4())

        snapshot_doc = {
            "_id": snapshot_id,
            "repo_id": repo_id,
            "file_path": file_path,
            "content": content,  # Could be compressed
            "content_hash": content_hash,
            "created_at": datetime.utcnow()
        }

        await self.snapshots_collection.insert_one(snapshot_doc)

        return snapshot_id

# Singleton instance
mongodb_service = MongoDBService()
