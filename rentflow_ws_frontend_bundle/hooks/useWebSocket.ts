'use client';
import { useEffect, useRef, useState } from 'react';

interface WSMessage<T = any> {
  event: string;
  data?: T;
}

export function useWebSocket<T = any>(url: string, onMessage?: (msg: WSMessage<T>) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000);
      };
      ws.onerror = (err) => console.error('WebSocket error:', err);
      ws.onmessage = (event) => {
        try {
          const msg: WSMessage<T> = JSON.parse(event.data);
          onMessage?.(msg);
        } catch (e) {
          console.error('Invalid WS message:', event.data);
        }
      };
    };

    connect();
    return () => ws && ws.close();
  }, [url, onMessage]);

  return { connected, send: (msg: WSMessage<T>) => wsRef.current?.send(JSON.stringify(msg)) };
}
