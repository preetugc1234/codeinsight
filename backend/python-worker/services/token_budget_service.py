"""
Token Budget Service - Track and enforce token usage limits
Integrates with Supabase for user plan info and MongoDB for detailed tracking
"""

import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from pymongo import MongoClient, DESCENDING
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)


class TokenBudgetService:
    """
    Service to track and enforce token budgets across different pricing tiers

    Pricing Tiers:
    - Trial: 7 days, 6,000 tokens (FREE)
    - Lite: $15/month, 200,000 tokens
    - Pro: $30/month, 500,000 tokens
    - Business: $200/month, 4,000,000 tokens
    """

    def __init__(self):
        # Supabase client for user profile data
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not supabase_url or not supabase_key:
            logger.warning("⚠️ Supabase credentials not found. Token tracking will be limited.")
            self.supabase = None
        else:
            self.supabase: Client = create_client(supabase_url, supabase_key)

        # MongoDB client for detailed token usage tracking
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            logger.warning("⚠️ MongoDB URI not found. Detailed token tracking disabled.")
            self.mongo_client = None
            self.db = None
        else:
            self.mongo_client = MongoClient(mongo_uri)
            self.db = self.mongo_client.code_insight
            self.token_usage_collection = self.db.token_usage
            self._ensure_indexes()

    def _ensure_indexes(self):
        """Create MongoDB indexes for efficient queries"""
        if self.db is None:
            return

        # Index for user_id + timestamp queries
        self.token_usage_collection.create_index([
            ("user_id", 1),
            ("timestamp", DESCENDING)
        ])

        # Index for user_id + billing_period queries
        self.token_usage_collection.create_index([
            ("user_id", 1),
            ("billing_period_month", 1)
        ])

        logger.info("✅ MongoDB indexes created for token tracking")

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile from Supabase including billing info"""
        if not self.supabase:
            return None

        try:
            response = self.supabase.table("profiles").select("*").eq("id", user_id).single().execute()
            return response.data if response.data else None
        except Exception as e:
            logger.error(f"❌ Error fetching user profile: {e}")
            return None

    def is_trial_expired(self, user_id: str) -> bool:
        """Check if user's trial period has expired"""
        profile = self.get_user_profile(user_id)

        if not profile:
            return False

        # If on trial plan, check if trial_end_date has passed
        if profile.get("plan") == "trial":
            trial_end = profile.get("trial_end_date")
            if trial_end:
                trial_end_dt = datetime.fromisoformat(trial_end.replace('Z', '+00:00'))
                return datetime.utcnow() > trial_end_dt

        return False

    def get_token_limit(self, plan: str) -> int:
        """Get monthly token limit for a plan"""
        limits = {
            "trial": 6_000,
            "lite": 200_000,
            "pro": 500_000,
            "business": 4_000_000
        }
        return limits.get(plan, 6_000)

    def check_budget_availability(self, user_id: str, estimated_tokens: int) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Check if user has budget for estimated tokens

        Returns:
            (allowed: bool, reason: str, budget_info: dict)
        """
        profile = self.get_user_profile(user_id)

        if not profile:
            return False, "User profile not found", {}

        plan = profile.get("plan", "trial")
        tokens_used = profile.get("tokens_used_this_month", 0)
        monthly_limit = profile.get("monthly_token_limit", self.get_token_limit(plan))

        # Check if trial has expired
        if plan == "trial" and self.is_trial_expired(user_id):
            return False, "trial_expired", {
                "plan": plan,
                "tokens_used": tokens_used,
                "monthly_limit": monthly_limit,
                "trial_expired": True,
                "message": "Your 7-day free trial has expired. Please upgrade to Lite, Pro, or Business plan to continue."
            }

        # Check if user has exceeded token limit
        if tokens_used >= monthly_limit:
            return False, "limit_exceeded", {
                "plan": plan,
                "tokens_used": tokens_used,
                "monthly_limit": monthly_limit,
                "usage_percentage": 100,
                "message": f"You've reached your monthly limit of {monthly_limit:,} tokens. Please upgrade your plan."
            }

        # Check if this request would exceed limit
        if tokens_used + estimated_tokens > monthly_limit:
            remaining = monthly_limit - tokens_used
            return False, "insufficient_tokens", {
                "plan": plan,
                "tokens_used": tokens_used,
                "monthly_limit": monthly_limit,
                "remaining_tokens": remaining,
                "requested_tokens": estimated_tokens,
                "usage_percentage": round((tokens_used / monthly_limit) * 100, 1),
                "message": f"Insufficient tokens. You have {remaining:,} tokens remaining, but this request needs ~{estimated_tokens:,} tokens."
            }

        # Calculate usage percentage for soft throttling warning
        usage_percentage = (tokens_used / monthly_limit) * 100

        budget_info = {
            "plan": plan,
            "tokens_used": tokens_used,
            "monthly_limit": monthly_limit,
            "remaining_tokens": monthly_limit - tokens_used,
            "usage_percentage": round(usage_percentage, 1),
            "estimated_tokens": estimated_tokens,
            "billing_period_end": profile.get("billing_period_end"),
            "soft_throttle": usage_percentage >= 90
        }

        # Soft throttle warning at 90%
        if usage_percentage >= 90:
            budget_info["message"] = f"Warning: You've used {usage_percentage:.1f}% of your monthly quota."

        return True, "approved", budget_info

    def record_token_usage(self, user_id: str, job_id: str, job_type: str,
                          input_tokens: int, output_tokens: int, total_tokens: int,
                          model: str = "claude-3-5-sonnet") -> bool:
        """
        Record token usage in MongoDB and update Supabase profile

        Args:
            user_id: User UUID
            job_id: Job identifier
            job_type: 'review', 'debug', or 'architecture'
            input_tokens: Tokens in prompt
            output_tokens: Tokens in response
            total_tokens: Total tokens used
            model: AI model used

        Returns:
            Success boolean
        """
        try:
            # Record in MongoDB for detailed tracking
            if self.db:
                usage_doc = {
                    "user_id": user_id,
                    "job_id": job_id,
                    "job_type": job_type,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": total_tokens,
                    "model": model,
                    "timestamp": datetime.utcnow(),
                    "billing_period_month": datetime.utcnow().strftime("%Y-%m")
                }
                self.token_usage_collection.insert_one(usage_doc)

            # Update Supabase profile tokens_used_this_month
            if self.supabase:
                profile = self.get_user_profile(user_id)
                if profile:
                    new_total = profile.get("tokens_used_this_month", 0) + total_tokens

                    self.supabase.table("profiles").update({
                        "tokens_used_this_month": new_total
                    }).eq("id", user_id).execute()

                    logger.info(f"✅ Recorded {total_tokens} tokens for user {user_id[:8]}... (Total: {new_total})")

            return True

        except Exception as e:
            logger.error(f"❌ Error recording token usage: {e}")
            return False

    def get_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get detailed usage statistics for a user"""
        profile = self.get_user_profile(user_id)

        if not profile:
            return {"error": "User not found"}

        plan = profile.get("plan", "trial")
        tokens_used = profile.get("tokens_used_this_month", 0)
        monthly_limit = profile.get("monthly_token_limit", self.get_token_limit(plan))

        stats = {
            "plan": plan,
            "tokens_used": tokens_used,
            "monthly_limit": monthly_limit,
            "remaining_tokens": monthly_limit - tokens_used,
            "usage_percentage": round((tokens_used / monthly_limit) * 100, 1) if monthly_limit > 0 else 0,
            "billing_period_start": profile.get("billing_period_start"),
            "billing_period_end": profile.get("billing_period_end"),
            "trial_end_date": profile.get("trial_end_date"),
            "is_trial": plan == "trial",
            "trial_expired": self.is_trial_expired(user_id) if plan == "trial" else False
        }

        # Get detailed breakdown from MongoDB if available
        if self.db:
            current_month = datetime.utcnow().strftime("%Y-%m")

            # Usage by job type this month
            usage_by_type = list(self.token_usage_collection.aggregate([
                {"$match": {"user_id": user_id, "billing_period_month": current_month}},
                {"$group": {
                    "_id": "$job_type",
                    "total_tokens": {"$sum": "$total_tokens"},
                    "count": {"$sum": 1}
                }}
            ]))

            stats["usage_by_type"] = {
                item["_id"]: {
                    "tokens": item["total_tokens"],
                    "jobs": item["count"]
                }
                for item in usage_by_type
            }

            # Recent usage (last 10 jobs)
            recent_jobs = list(self.token_usage_collection.find(
                {"user_id": user_id}
            ).sort("timestamp", DESCENDING).limit(10))

            stats["recent_usage"] = [
                {
                    "job_id": job["job_id"],
                    "job_type": job["job_type"],
                    "tokens": job["total_tokens"],
                    "timestamp": job["timestamp"].isoformat()
                }
                for job in recent_jobs
            ]

        return stats

    def reset_monthly_usage(self, user_id: str) -> bool:
        """Reset monthly token usage (called when billing period renews)"""
        try:
            if not self.supabase:
                return False

            # Reset tokens and update billing period
            now = datetime.utcnow()

            self.supabase.table("profiles").update({
                "tokens_used_this_month": 0,
                "billing_period_start": now.isoformat(),
                "billing_period_end": (now + timedelta(days=30)).isoformat()
            }).eq("id", user_id).execute()

            logger.info(f"✅ Reset monthly usage for user {user_id[:8]}...")
            return True

        except Exception as e:
            logger.error(f"❌ Error resetting monthly usage: {e}")
            return False


# Singleton instance
token_budget_service = TokenBudgetService()
