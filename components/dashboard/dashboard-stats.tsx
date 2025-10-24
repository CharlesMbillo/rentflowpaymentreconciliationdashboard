"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle2, Clock, AlertCircle, DoorOpen } from "lucide-react"

interface DashboardStatsProps {
  summary: {
    total_rooms: number
    occupied: number
    vacant: number
    paid: number
    partial: number
    overdue: number
    pending: number
  }
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const occupancyRate = summary.total_rooms > 0 ? ((summary.occupied / summary.total_rooms) * 100).toFixed(1) : "0"

  const collectionRate =
    summary.occupied > 0 ? (((summary.paid + summary.partial * 0.5) / summary.occupied) * 100).toFixed(1) : "0"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total_rooms}</div>
          <p className="text-xs text-muted-foreground">
            {summary.occupied} occupied, {summary.vacant} vacant
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{occupancyRate}%</div>
          <p className="text-xs text-muted-foreground">
            {summary.occupied} of {summary.total_rooms} rooms
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{summary.paid}</div>
          <p className="text-xs text-muted-foreground">Fully paid this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Partial/Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{summary.partial + summary.pending}</div>
          <p className="text-xs text-muted-foreground">
            {summary.partial} partial, {summary.pending} pending
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
          <p className="text-xs text-muted-foreground">Collection rate: {collectionRate}%</p>
        </CardContent>
      </Card>
    </div>
  )
}
