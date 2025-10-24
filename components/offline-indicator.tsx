"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WifiOff, Wifi } from "lucide-react"
import { useEffect, useState } from "react"

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowAlert(true)
    } else {
      // Hide alert after coming back online
      const timer = setTimeout(() => setShowAlert(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (!showAlert) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant={isOnline ? "default" : "destructive"}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertDescription>
          {isOnline
            ? "You're back online! Your changes will be synced."
            : "You're offline. Changes will be saved locally and synced when you reconnect."}
        </AlertDescription>
      </Alert>
    </div>
  )
}
