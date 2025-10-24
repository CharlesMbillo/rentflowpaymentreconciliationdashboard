import { NextResponse } from "next/server"
import { getTenants } from "@/lib/actions/tenants"

export async function GET() {
  try {
    const tenants = await getTenants()
    return NextResponse.json(tenants)
  } catch (error) {
    console.error("[API] Error fetching tenants:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}
