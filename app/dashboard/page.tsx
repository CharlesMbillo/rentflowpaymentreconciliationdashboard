"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RoomMatrix } from "@/components/dashboard/room-matrix"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"

export default function DashboardPage() {
  const [matrixData, setMatrixData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard")
        if (!response.ok) throw new Error("Failed to fetch dashboard data")
        const data = await response.json()
        setMatrixData(data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !matrixData) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Dashboard</h1>
            <p className="text-muted-foreground">Real-time room occupancy and payment status across all properties</p>
          </div>
        </div>

        <DashboardStats summary={matrixData.summary} />
        <RoomMatrix data={matrixData} />
      </main>
    </div>
  )
}
