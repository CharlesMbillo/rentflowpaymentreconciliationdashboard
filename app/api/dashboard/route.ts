import { NextResponse } from "next/server"
import { getRoomMatrixData } from "@/lib/actions/rooms"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get("monthYear") || undefined

    const data = await getRoomMatrixData(monthYear)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
