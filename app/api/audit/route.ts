import { NextResponse } from "next/server"
import { getAuditLogs, getRecentActivity } from "@/lib/actions/audit"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const [logs, activity] = await Promise.all([getAuditLogs({ limit }), getRecentActivity(10)])

    return NextResponse.json({
      logs,
      activity,
    })
  } catch (error) {
    console.error("[API] Error fetching audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
