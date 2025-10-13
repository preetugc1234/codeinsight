import json
import hashlib
from typing import Dict, Any, Optional
import redis.asyncio as redis
from config import settings
import asyncio

class CacheService:
    """
    Redis cache layer for AI prompts and responses
    - Cache key: hash(prompt + context)
    - TTL: 24h for reviews, configurable per type
    - Cache hit/miss logging
    """

    def __init__(self):
        self.redis_url = settings.redis_url
        self.redis_client: Optional[redis.Redis] = None
        self.hits = 0
        self.misses = 0

    async def connect(self):
        """
        Initialize Redis connection
        """
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.redis_client.ping()
            print("✅ Redis cache connected successfully")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            self.redis_client = None

    async def disconnect(self):
        """
        Close Redis connection
        """
        if self.redis_client:
            await self.redis_client.close()
            print("🔌 Redis disconnected")

    def generate_cache_key(self, prompt: str, context: str = "") -> str:
        """
        Generate cache key from hash(prompt + context)

        Args:
            prompt: The prompt text
            context: Additional context (code, error log, etc.)

        Returns:
            SHA256 hash as cache key
        """
        combined = f"{prompt}||{context}"
        return hashlib.sha256(combined.encode()).hexdigest()

    async def get(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached response by key

        Args:
            cache_key: Cache key to lookup

        Returns:
            Cached data dict or None if not found
        """
        if not self.redis_client:
            return None

        try:
            cached_data = await self.redis_client.get(f"prompt:{cache_key}")

            if cached_data:
                self.hits += 1
                print(f"✅ Cache HIT for key: {cache_key[:16]}... (Total hits: {self.hits})")
                return json.loads(cached_data)
            else:
                self.misses += 1
                print(f"❌ Cache MISS for key: {cache_key[:16]}... (Total misses: {self.misses})")
                return None

        except Exception as e:
            print(f"⚠️ Cache get error: {e}")
            return None

    async def set(
        self,
        cache_key: str,
        data: Dict[str, Any],
        ttl: int = 86400
    ) -> bool:
        """
        Cache a response with TTL

        Args:
            cache_key: Cache key
            data: Data to cache (will be JSON serialized)
            ttl: Time to live in seconds (default 24h)

        Returns:
            True if successful, False otherwise
        """
        if not self.redis_client:
            return False

        try:
            json_data = json.dumps(data)
            await self.redis_client.setex(
                f"prompt:{cache_key}",
                ttl,
                json_data
            )
            print(f"💾 Cached response for key: {cache_key[:16]}... (TTL: {ttl}s)")
            return True

        except Exception as e:
            print(f"⚠️ Cache set error: {e}")
            return False

    async def invalidate(self, cache_key: str) -> bool:
        """
        Invalidate (delete) a cached entry

        Args:
            cache_key: Cache key to delete

        Returns:
            True if deleted, False otherwise
        """
        if not self.redis_client:
            return False

        try:
            deleted = await self.redis_client.delete(f"prompt:{cache_key}")
            if deleted:
                print(f"🗑️ Invalidated cache key: {cache_key[:16]}...")
            return bool(deleted)

        except Exception as e:
            print(f"⚠️ Cache invalidate error: {e}")
            return False

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics

        Returns:
            Dict with hits, misses, and hit rate
        """
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        stats = {
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total,
            "hit_rate_percent": round(hit_rate, 2)
        }

        # Try to get Redis info
        if self.redis_client:
            try:
                info = await self.redis_client.info()
                stats["redis_connected"] = True
                stats["redis_used_memory"] = info.get("used_memory_human", "N/A")
            except:
                stats["redis_connected"] = False
        else:
            stats["redis_connected"] = False

        return stats

    async def clear_all_cache(self) -> int:
        """
        Clear all cached prompts (use with caution!)

        Returns:
            Number of keys deleted
        """
        if not self.redis_client:
            return 0

        try:
            keys = []
            async for key in self.redis_client.scan_iter("prompt:*"):
                keys.append(key)

            if keys:
                deleted = await self.redis_client.delete(*keys)
                print(f"🗑️ Cleared {deleted} cached prompt(s)")
                return deleted
            return 0

        except Exception as e:
            print(f"⚠️ Clear cache error: {e}")
            return 0

    def log_cache_stats(self):
        """
        Log current cache statistics
        """
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        print(f"\n📊 Cache Statistics:")
        print(f"   Hits: {self.hits}")
        print(f"   Misses: {self.misses}")
        print(f"   Hit Rate: {hit_rate:.2f}%")
        print(f"   Total Requests: {total}\n")

# Singleton instance
cache_service = CacheService()
