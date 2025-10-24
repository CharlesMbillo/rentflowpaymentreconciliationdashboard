"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AnalyticsSummary } from "@/components/analytics/analytics-summary"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { OccupancyChart } from "@/components/analytics/occupancy-chart"
import { PaymentTrendsChart } from "@/components/analytics/payment-trends-chart"
import { TopTenants } from "@/components/analytics/top-tenants"
import { OverdueList } from "@/components/analytics/overdue-list"

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/analytics")
        if (!response.ok) throw new Error("Failed to fetch analytics")
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Insights and trends for your property management</p>
        </div>

        <AnalyticsSummary summary={data.summary} />

        <div className="grid gap-6 md:grid-cols-2">
          <RevenueChart data={data.revenue} />
          <OccupancyChart data={data.occupancy} />
        </div>

        <PaymentTrendsChart data={data.trends} />

        <div className="grid gap-6 md:grid-cols-2">
          <TopTenants tenants={data.topTenants} />
          <OverdueList overduePayments={data.overdue} />
        </div>
      </main>
    </div>
  )
}
