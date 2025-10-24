"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, AlertTriangle } from "lucide-react"

interface AnalyticsSummaryProps {
  summary: {
    total_occupied: number
    total_vacant: number
    total_tenants: number
    active_leases: number
    current_month_revenue: number
    expected_month_revenue: number
    overdue_count: number
  }
}

export function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  const collectionRate =
    summary.expected_month_revenue > 0
      ? ((Number(summary.current_month_revenue) / Number(summary.expected_month_revenue)) * 100).toFixed(1)
      : "0"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">KES {Number(summary.current_month_revenue).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {collectionRate}% of KES {Number(summary.expected_month_revenue).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.active_leases}</div>
          <p className="text-xs text-muted-foreground">{summary.total_tenants} total registered</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total_occupied}</div>
          <p className="text-xs text-muted-foreground">{summary.total_vacant} vacant rooms</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{summary.overdue_count}</div>
          <p className="text-xs text-muted-foreground">Require immediate attention</p>
        </CardContent>
      </Card>
    </div>
  )
}
