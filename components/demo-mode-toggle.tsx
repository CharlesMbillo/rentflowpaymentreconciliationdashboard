"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useDemoMode } from "@/lib/realtime"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Mode</CardTitle>
        <CardDescription>Test payment notifications without actual Jenga PGW integration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch id="demo-mode" checked={isDemoMode} onCheckedChange={toggleDemoMode} />
          <Label htmlFor="demo-mode">{isDemoMode ? "Demo Mode Active" : "Live Mode"}</Label>
        </div>
        {isDemoMode && (
          <p className="text-sm text-muted-foreground mt-2">
            Demo mode is active. You can simulate payment notifications for testing.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
