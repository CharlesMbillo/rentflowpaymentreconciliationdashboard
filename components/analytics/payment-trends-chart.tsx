"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { PaymentTrend } from "@/lib/actions/analytics"

interface PaymentTrendsChartProps {
  data: PaymentTrend[]
}

export function PaymentTrendsChart({ data }: PaymentTrendsChartProps) {
  const chartData = data
    .map((item) => ({
      month: new Date(item.month_year + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      paid: Number(item.paid),
      partial: Number(item.partial),
      overdue: Number(item.overdue),
      pending: Number(item.pending),
    }))
    .reverse()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status Trends</CardTitle>
        <CardDescription>Monthly payment status distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="paid" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" />
            <Area
              type="monotone"
              dataKey="partial"
              stackId="1"
              stroke="hsl(var(--chart-4))"
              fill="hsl(var(--chart-4))"
            />
            <Area
              type="monotone"
              dataKey="pending"
              stackId="1"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
            />
            <Area
              type="monotone"
              dataKey="overdue"
              stackId="1"
              stroke="hsl(var(--chart-5))"
              fill="hsl(var(--chart-5))"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
