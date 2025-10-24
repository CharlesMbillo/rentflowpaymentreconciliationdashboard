"use client"

import { useEffect, useState } from "react"

export type RealtimeEvent = {
  type: "payment_received" | "room_status_changed" | "tenant_updated" | "lease_created"
  data: any
  timestamp: number
}

// Polling-based real-time updates (simpler than WebSocket for this use case)
export function useRealtimeUpdates(interval = 30000) {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!isPolling) return

    const pollInterval = setInterval(() => {
      setLastUpdate(Date.now())
    }, interval)

    return () => clearInterval(pollInterval)
  }, [interval, isPolling])

  return {
    lastUpdate,
    isPolling,
    setIsPolling,
    refresh: () => setLastUpdate(Date.now()),
  }
}

// Demo mode for testing without actual backend
export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const demoMode = localStorage.getItem("rentflow_demo_mode") === "true"
      setIsDemoMode(demoMode)
    }
  }, [])

  const toggleDemoMode = () => {
    const newMode = !isDemoMode
    setIsDemoMode(newMode)
    if (typeof window !== "undefined") {
      localStorage.setItem("rentflow_demo_mode", String(newMode))
    }
  }

  return { isDemoMode, toggleDemoMode }
}

// Simulate payment notification in demo mode
export function simulatePaymentNotification(leaseId: number, amount: number) {
  const event: RealtimeEvent = {
    type: "payment_received",
    data: {
      lease_id: leaseId,
      amount,
      transaction_reference: `DEMO_${Date.now()}`,
      payment_date: new Date().toISOString(),
    },
    timestamp: Date.now(),
  }

  // Dispatch custom event
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rentflow_realtime", { detail: event }))
  }

  return event
}
