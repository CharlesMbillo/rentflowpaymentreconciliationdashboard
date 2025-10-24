"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { BlockOccupancy } from "@/lib/actions/analytics"

interface OccupancyChartProps {
  data: BlockOccupancy[]
}

export function OccupancyChart({ data }: OccupancyChartProps) {
  const chartData = data.map((item) => ({
    block: `Block ${item.block_name}`,
    occupied: Number(item.occupied_rooms),
    vacant: Number(item.vacant_rooms),
    rate: Number(item.occupancy_rate).toFixed(1),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Block Occupancy</CardTitle>
        <CardDescription>Room occupancy across all blocks</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="block" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="occupied" fill="hsl(var(--chart-1))" name="Occupied" stackId="a" />
            <Bar dataKey="vacant" fill="hsl(var(--chart-3))" name="Vacant" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
