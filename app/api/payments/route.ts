import { type NextRequest, NextResponse } from "next/server"
import { getPayments } from "@/lib/actions/payments"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || undefined
    const month_year = searchParams.get("month_year") || undefined
    const tenant_id = searchParams.get("tenant_id") ? Number.parseInt(searchParams.get("tenant_id")!) : undefined

    const payments = await getPayments({
      status,
      month_year,
      tenant_id,
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("[v0] API error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}
