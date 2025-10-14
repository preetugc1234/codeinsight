"""
WebSocket Service for Real-Time Job Status Updates
Following prompt.md line 222: "Worker pushes result to MongoDB jobs and notifies client (WebSocket or extension polling)"
"""

from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio

class WebSocketManager:
    """
    Manages WebSocket connections for real-time job status updates
    Each user can have multiple connections (multiple tabs/clients)
    """

    def __init__(self):
        # Store active connections: {user_id: Set[WebSocket]}
        self.active_connections: Dict[str, Set[WebSocket]] = {}

        # Store job subscriptions: {job_id: Set[WebSocket]}
        self.job_subscriptions: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection and register user"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()

        self.active_connections[user_id].add(websocket)
        print(f"✅ WebSocket connected: user_id={user_id}, total_connections={len(self.active_connections[user_id])}")

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)

            # Cleanup empty user entries
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        # Remove from job subscriptions
        for job_id in list(self.job_subscriptions.keys()):
            self.job_subscriptions[job_id].discard(websocket)
            if not self.job_subscriptions[job_id]:
                del self.job_subscriptions[job_id]

        print(f"❌ WebSocket disconnected: user_id={user_id}")

    async def subscribe_to_job(self, websocket: WebSocket, job_id: str):
        """Subscribe websocket to specific job updates"""
        if job_id not in self.job_subscriptions:
            self.job_subscriptions[job_id] = set()

        self.job_subscriptions[job_id].add(websocket)
        print(f"🔔 Subscribed to job: {job_id}")

    async def unsubscribe_from_job(self, websocket: WebSocket, job_id: str):
        """Unsubscribe websocket from job updates"""
        if job_id in self.job_subscriptions:
            self.job_subscriptions[job_id].discard(websocket)

            if not self.job_subscriptions[job_id]:
                del self.job_subscriptions[job_id]

        print(f"🔕 Unsubscribed from job: {job_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific WebSocket"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"❌ Error sending message: {e}")

    async def broadcast_to_user(self, message: dict, user_id: str):
        """
        Broadcast message to all connections of a specific user
        Used when job status updates (all user's tabs should see it)
        """
        if user_id not in self.active_connections:
            print(f"⚠️  No active connections for user: {user_id}")
            return

        disconnected = set()

        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"❌ Error broadcasting to user {user_id}: {e}")
                disconnected.add(websocket)

        # Cleanup disconnected websockets
        for ws in disconnected:
            await self.disconnect(ws, user_id)

    async def broadcast_to_job(self, message: dict, job_id: str):
        """
        Broadcast message to all subscribers of a specific job
        Used when job status changes
        """
        if job_id not in self.job_subscriptions:
            print(f"⚠️  No subscribers for job: {job_id}")
            return

        disconnected = set()

        for websocket in self.job_subscriptions[job_id]:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"❌ Error broadcasting to job {job_id}: {e}")
                disconnected.add(websocket)

        # Cleanup disconnected websockets
        for ws in disconnected:
            # Find user_id for this websocket
            for user_id, connections in self.active_connections.items():
                if ws in connections:
                    await self.disconnect(ws, user_id)
                    break

    async def notify_job_update(self, job_id: str, user_id: str, status: str, data: dict = None):
        """
        Notify about job status update
        This is called from review_pipeline.py when job status changes
        """
        message = {
            "type": "job_update",
            "job_id": job_id,
            "status": status,
            "timestamp": data.get("updated_at") if data else None,
            "data": data or {}
        }

        print(f"📤 Notifying job update: job_id={job_id}, status={status}")

        # Send to both job subscribers and user connections
        await self.broadcast_to_job(message, job_id)
        await self.broadcast_to_user(message, user_id)

    async def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())

    async def get_user_connection_count(self, user_id: str) -> int:
        """Get connection count for specific user"""
        return len(self.active_connections.get(user_id, set()))

# Singleton instance
websocket_manager = WebSocketManager()
