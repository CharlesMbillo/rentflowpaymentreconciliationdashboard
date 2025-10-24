"use client"

import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"
import { useRealtimeUpdates } from "@/lib/realtime"

export function RealtimeBadge() {
  const { isPolling } = useRealtimeUpdates()

  return (
    <Badge variant={isPolling ? "default" : "secondary"} className="gap-1">
      <Activity className={`h-3 w-3 ${isPolling ? "animate-pulse" : ""}`} />
      {isPolling ? "Live" : "Paused"}
    </Badge>
  )
}
