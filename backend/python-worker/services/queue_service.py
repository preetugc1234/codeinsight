"""
Redis Streams Job Queue Consumer
Listens to review_jobs stream and processes concurrently
Following prompt.md lines 173-190, 814-838
"""

import asyncio
import json
from typing import Dict, Any, Optional, List
import redis.asyncio as redis
from config import settings

class QueueService:
    """
    Redis Streams consumer for job queue
    - Listen to 'review_jobs' stream
    - Dequeue jobs
    - Process concurrently (5 workers)
    - Update job status in MongoDB
    """

    def __init__(self):
        self.redis_url = settings.redis_url
        self.redis_client: Optional[redis.Redis] = None
        self.stream_name = "review_jobs"
        self.consumer_group = "python_workers"
        self.consumer_name = "worker_1"
        self.max_workers = 5
        self.running = False

    async def connect(self):
        """Initialize Redis connection and create consumer group"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )

            # Test connection
            await self.redis_client.ping()

            # Create consumer group if it doesn't exist
            try:
                await self.redis_client.xgroup_create(
                    name=self.stream_name,
                    groupname=self.consumer_group,
                    id="0",
                    mkstream=True
                )
                print(f"✅ Created consumer group '{self.consumer_group}' for stream '{self.stream_name}'")
            except redis.ResponseError as e:
                if "BUSYGROUP" in str(e):
                    print(f"✅ Consumer group '{self.consumer_group}' already exists")
                else:
                    raise

            print("✅ Redis Streams connected successfully")

        except Exception as e:
            print(f"❌ Redis Streams connection failed: {e}")
            self.redis_client = None

    async def disconnect(self):
        """Close Redis connection"""
        self.running = False
        if self.redis_client:
            await self.redis_client.close()
            print("🔌 Redis Streams disconnected")

    async def enqueue_job(self, job_data: Dict[str, Any]) -> str:
        """
        Enqueue a job to Redis Stream
        Called from Java API or directly from endpoints
        """
        if not self.redis_client:
            raise Exception("Redis not connected")

        try:
            # Add job to stream
            message_id = await self.redis_client.xadd(
                name=self.stream_name,
                fields={"data": json.dumps(job_data)}
            )

            print(f"✅ Job enqueued: {job_data.get('job_id')} (message_id: {message_id})")
            return message_id

        except Exception as e:
            print(f"❌ Failed to enqueue job: {e}")
            raise

    async def dequeue_jobs(self, count: int = 10, block: int = 5000) -> List[Dict[str, Any]]:
        """
        Dequeue jobs from Redis Stream using consumer group

        Args:
            count: Number of messages to fetch
            block: Block time in milliseconds (5000 = 5 seconds)

        Returns:
            List of job messages with format: [{'id': message_id, 'data': job_data}]
        """
        if not self.redis_client:
            return []

        try:
            # Read from consumer group
            # '>' means get new messages not delivered to other consumers
            messages = await self.redis_client.xreadgroup(
                groupname=self.consumer_group,
                consumername=self.consumer_name,
                streams={self.stream_name: ">"},
                count=count,
                block=block
            )

            jobs = []

            # Parse messages
            # Format: [(stream_name, [(message_id, {field: value})])]
            if messages:
                for stream_name, stream_messages in messages:
                    for message_id, fields in stream_messages:
                        job_data = json.loads(fields.get("data", "{}"))
                        jobs.append({
                            "message_id": message_id,
                            "data": job_data
                        })

            if jobs:
                print(f"📥 Dequeued {len(jobs)} job(s) from stream")

            return jobs

        except Exception as e:
            print(f"⚠️  Error dequeuing jobs: {e}")
            return []

    async def acknowledge_job(self, message_id: str) -> bool:
        """
        Acknowledge job completion (remove from pending list)
        """
        if not self.redis_client:
            return False

        try:
            # ACK the message
            result = await self.redis_client.xack(
                self.stream_name,
                self.consumer_group,
                message_id
            )

            if result:
                print(f"✅ Job acknowledged: {message_id}")
                return True

            return False

        except Exception as e:
            print(f"⚠️  Error acknowledging job: {e}")
            return False

    async def start_consumer(self, process_callback):
        """
        Start consuming jobs from stream with concurrent workers

        Args:
            process_callback: Async function to process each job
                             Should have signature: async def process(job_data: Dict) -> bool
        """
        if not self.redis_client:
            print("❌ Cannot start consumer: Redis not connected")
            return

        self.running = True
        print(f"🚀 Starting job consumer with {self.max_workers} workers...")

        # Create semaphore to limit concurrent workers
        semaphore = asyncio.Semaphore(self.max_workers)

        async def process_with_semaphore(job):
            """Process job with semaphore to limit concurrency"""
            async with semaphore:
                try:
                    message_id = job["message_id"]
                    job_data = job["data"]

                    print(f"⚙️  Processing job: {job_data.get('job_id', 'unknown')}")

                    # Call the processing callback
                    success = await process_callback(job_data)

                    # Acknowledge job if processed successfully
                    if success:
                        await self.acknowledge_job(message_id)
                    else:
                        print(f"⚠️  Job processing failed: {job_data.get('job_id')}")

                except Exception as e:
                    print(f"❌ Error processing job: {e}")

        # Main consumer loop
        while self.running:
            try:
                # Dequeue jobs (blocks for 5 seconds if no jobs)
                jobs = await self.dequeue_jobs(count=self.max_workers, block=5000)

                if jobs:
                    # Process jobs concurrently
                    tasks = [process_with_semaphore(job) for job in jobs]
                    await asyncio.gather(*tasks, return_exceptions=True)

                # Small delay to prevent tight loop
                await asyncio.sleep(0.1)

            except asyncio.CancelledError:
                print("🛑 Consumer cancelled")
                break

            except Exception as e:
                print(f"❌ Consumer error: {e}")
                await asyncio.sleep(1)  # Wait before retrying

        print("🛑 Job consumer stopped")

    async def get_stream_info(self) -> Dict[str, Any]:
        """Get info about the stream and consumer group"""
        if not self.redis_client:
            return {"error": "Redis not connected"}

        try:
            # Get stream info
            stream_info = await self.redis_client.xinfo_stream(self.stream_name)

            # Get consumer group info
            groups_info = await self.redis_client.xinfo_groups(self.stream_name)

            return {
                "stream": {
                    "length": stream_info.get("length", 0),
                    "first_entry": stream_info.get("first-entry"),
                    "last_entry": stream_info.get("last-entry"),
                },
                "consumer_groups": groups_info
            }

        except Exception as e:
            return {"error": str(e)}

# Singleton instance
queue_service = QueueService()
