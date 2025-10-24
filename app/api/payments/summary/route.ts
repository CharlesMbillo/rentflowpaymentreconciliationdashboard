import { type NextRequest, NextResponse } from "next/server"
import { getPaymentSummary } from "@/lib/actions/payments"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month_year = searchParams.get("month_year") || undefined

    const summary = await getPaymentSummary(month_year)

    return NextResponse.json(summary)
  } catch (error) {
    console.error("[v0] API error fetching payment summary:", error)
    return NextResponse.json({ error: "Failed to fetch payment summary" }, { status: 500 })
  }
}
