"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DemoModeToggle } from "@/components/demo-mode-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your RentFlow application</p>
        </div>

        <div className="space-y-6">
          <DemoModeToggle />

          <Card>
            <CardHeader>
              <CardTitle>Offline Mode</CardTitle>
              <CardDescription>Manage offline data and sync settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Clear Offline Cache</p>
                  <p className="text-sm text-muted-foreground">Remove all locally stored data</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.clear()
                      window.location.reload()
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jenga PGW Integration</CardTitle>
              <CardDescription>Configure payment gateway settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Webhook URL</p>
                <code className="block p-2 bg-muted rounded text-xs">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/jenga-ipn
                </code>
                <p className="text-xs text-muted-foreground">
                  Configure this URL in your Jenga PGW dashboard to receive payment notifications
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Account Number Format</p>
                <code className="block p-2 bg-muted rounded text-xs">LEASE-[lease_id] or TENANT-[tenant_id]</code>
                <p className="text-xs text-muted-foreground">
                  Use this format when configuring payment references in Jenga PGW
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>Configure automatic refresh settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  Dashboard automatically refreshes every 30 seconds to show latest payment status
                </p>
                <p className="text-xs text-muted-foreground">
                  The "Live" badge in the header indicates active real-time monitoring
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
