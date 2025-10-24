'use client';
import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDashboardStore } from '@/store/dashboard';

export default function DashboardListener() {
  const { updatePayment } = useDashboardStore();

  const { connected } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/api/ws',
    (msg) => {
      if (msg.event === 'payment_update' && msg.data) {
        updatePayment(msg.data);
      }
    }
  );

  useEffect(() => {
    console.log('WebSocket connected:', connected);
  }, [connected]);

  return null;
}
