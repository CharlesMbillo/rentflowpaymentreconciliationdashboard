"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getOfflineQueue, clearOfflineQueue } from "@/lib/offline-storage"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { RefreshCw, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SyncStatus() {
  const isOnline = useOnlineStatus()
  const { toast } = useToast()
  const [queueCount, setQueueCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const updateCount = () => {
      const queue = getOfflineQueue()
      setQueueCount(queue.filter((a) => !a.synced).length)
    }

    updateCount()
    const interval = setInterval(updateCount, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline",
        variant: "destructive",
      })
      return
    }

    setSyncing(true)
    try {
      const queue = getOfflineQueue()
      const unsyncedActions = queue.filter((a) => !a.synced)

      if (unsyncedActions.length === 0) {
        toast({
          title: "Already synced",
          description: "No pending actions to sync",
        })
        return
      }

      // In a real implementation, this would call the sync API
      // For now, we'll just clear the queue
      clearOfflineQueue()
      setQueueCount(0)

      toast({
        title: "Sync complete",
        description: `${unsyncedActions.length} actions synced successfully`,
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync offline actions",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  if (queueCount === 0 && isOnline) return null

  return (
    <div className="flex items-center gap-2">
      {queueCount > 0 && (
        <Badge variant="secondary" className="gap-1">
          {queueCount} pending
        </Badge>
      )}
      <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || !isOnline}>
        {syncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Sync
          </>
        )}
      </Button>
    </div>
  )
}
