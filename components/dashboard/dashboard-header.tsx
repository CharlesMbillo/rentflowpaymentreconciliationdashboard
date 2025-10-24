"use client"

import { UserNav } from "@/components/user-nav"
import { ModeToggles } from "@/components/mode-toggles"
import { Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RealtimeBadge } from "@/components/realtime-badge"
import { SyncStatus } from "@/components/sync-status"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="font-bold text-xl">RentFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/tenants">Tenants</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/payments">Payments</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/analytics">Analytics</Link>
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <RealtimeBadge />
          <SyncStatus />
          <ModeToggles />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
