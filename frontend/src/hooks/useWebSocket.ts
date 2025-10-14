/**
 * WebSocket Hook for Real-Time Job Updates
 * Following prompt.md line 222: "notify client via WebSocket"
 * NO MOCK DATA - Real WebSocket connection to Python Worker
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_PYTHON_WORKER_WS_URL || 'ws://localhost:8000';

export interface WebSocketMessage {
  type: 'job_update' | 'subscribed' | 'unsubscribed' | 'pong';
  job_id?: string;
  status?: string;
  timestamp?: string;
  data?: any;
}

export function useWebSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId || wsRef.current) return;

    try {
      const ws = new WebSocket(`${WS_URL}/ws/${userId}`);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);

        // Start ping interval to keep connection alive
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📥 WebSocket message:', message);
          setLastMessage(message);
        } catch (err) {
          console.error('❌ Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect after 3 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reconnecting WebSocket...');
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('❌ Failed to create WebSocket:', err);
    }
  }, [userId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Subscribe to job updates
  const subscribeToJob = useCallback((jobId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        job_id: jobId
      }));
      console.log(`🔔 Subscribed to job: ${jobId}`);
    }
  }, []);

  // Unsubscribe from job updates
  const unsubscribeFromJob = useCallback((jobId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        job_id: jobId
      }));
      console.log(`🔕 Unsubscribed from job: ${jobId}`);
    }
  }, []);

  // Auto-connect when userId is available
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    subscribeToJob,
    unsubscribeFromJob,
    connect,
    disconnect,
  };
}
