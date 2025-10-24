import { NextResponse } from "next/server"
import {
  getMonthlyRevenue,
  getBlockOccupancy,
  getPaymentTrends,
  getTopPayingTenants,
  getOverduePayments,
  getAnalyticsSummary,
} from "@/lib/actions/analytics"

export async function GET() {
  try {
    const [summary, revenue, occupancy, trends, topTenants, overdue] = await Promise.all([
      getAnalyticsSummary(),
      getMonthlyRevenue(6),
      getBlockOccupancy(),
      getPaymentTrends(6),
      getTopPayingTenants(10),
      getOverduePayments(),
    ])

    return NextResponse.json({
      summary,
      revenue,
      occupancy,
      trends,
      topTenants,
      overdue,
    })
  } catch (error) {
    console.error("[API] Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
