"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { MonthlyRevenue } from "@/lib/actions/analytics"

interface RevenueChartProps {
  data: MonthlyRevenue[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data
    .map((item) => ({
      month: new Date(item.month_year + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      collected: Number(item.total_revenue),
      expected: Number(item.expected_revenue),
    }))
    .reverse()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>Monthly revenue collection vs expected</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="collected" fill="hsl(var(--chart-1))" name="Collected" />
            <Bar dataKey="expected" fill="hsl(var(--chart-2))" name="Expected" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
