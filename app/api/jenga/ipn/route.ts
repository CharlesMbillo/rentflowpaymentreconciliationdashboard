import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyJengaHMAC, parseAccountNumber, type JengaIPNPayload } from "@/lib/jenga-ipn"
import { updatePaymentStatus } from "@/lib/actions/payments"

const sql = neon(process.env.DATABASE_URL!)

// Jenga PGW IPN webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-jenga-signature") || ""

    // Log the IPN request
    const ipnLog = await sql`
      INSERT INTO ipn_logs (transaction_reference, payload, hmac_signature, verified, processed)
      VALUES ('pending', ${body}, ${signature}, false, false)
      RETURNING id
    `

    const ipnLogId = ipnLog[0].id

    // Verify HMAC signature
    const jengaSecret = process.env.JENGA_HMAC_SECRET || "your-jenga-secret-key"
    const isValid = verifyJengaHMAC(body, signature, jengaSecret)

    if (!isValid) {
      await sql`
        UPDATE ipn_logs
        SET error_message = 'Invalid HMAC signature', verified = false
        WHERE id = ${ipnLogId}
      `

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Parse payload
    const payload: JengaIPNPayload = JSON.parse(body)

    // Update IPN log with transaction reference
    await sql`
      UPDATE ipn_logs
      SET transaction_reference = ${payload.transactionReference}, verified = true
      WHERE id = ${ipnLogId}
    `

    // Only process successful payments
    if (payload.status !== "SUCCESS") {
      await sql`
        UPDATE ipn_logs
        SET processed = true, error_message = ${`Payment status: ${payload.status}`}
        WHERE id = ${ipnLogId}
      `

      return NextResponse.json({ message: "Payment not successful", status: payload.status })
    }

    // Parse account number to get lease/tenant info
    const accountInfo = parseAccountNumber(payload.accountNumber)

    if (accountInfo.type === "unknown" || !accountInfo.id) {
      await sql`
        UPDATE ipn_logs
        SET processed = true, error_message = 'Invalid account number format'
        WHERE id = ${ipnLogId}
      `

      return NextResponse.json({ error: "Invalid account number" }, { status: 400 })
    }

    // Get lease information
    let leaseId: number
    let tenantId: number
    let roomId: number

    if (accountInfo.type === "lease") {
      const lease = await sql`
        SELECT l.id, l.tenant_id, r.id as room_id
        FROM leases l
        JOIN rooms r ON l.room_id = r.id
        WHERE l.id = ${accountInfo.id} AND l.status = 'active'
        LIMIT 1
      `

      if (lease.length === 0) {
        await sql`
          UPDATE ipn_logs
          SET processed = true, error_message = 'Lease not found or inactive'
          WHERE id = ${ipnLogId}
        `
        return NextResponse.json({ error: "Lease not found" }, { status: 404 })
      }

      leaseId = lease[0].id
      tenantId = lease[0].tenant_id
      roomId = lease[0].room_id
    } else {
      // tenant type
      const lease = await sql`
        SELECT l.id, l.tenant_id, r.id as room_id
        FROM leases l
        JOIN rooms r ON l.room_id = r.id
        WHERE l.tenant_id = ${accountInfo.id} AND l.status = 'active'
        LIMIT 1
      `

      if (lease.length === 0) {
        await sql`
          UPDATE ipn_logs
          SET processed = true, error_message = 'No active lease found for tenant'
          WHERE id = ${ipnLogId}
        `
        return NextResponse.json({ error: "No active lease found" }, { status: 404 })
      }

      leaseId = lease[0].id
      tenantId = lease[0].tenant_id
      roomId = lease[0].room_id
    }

    // Check if payment already exists
    const existingPayment = await sql`
      SELECT id FROM payments
      WHERE transaction_reference = ${payload.transactionReference}
      LIMIT 1
    `

    if (existingPayment.length > 0) {
      await sql`
        UPDATE ipn_logs
        SET processed = true, error_message = 'Duplicate transaction'
        WHERE id = ${ipnLogId}
      `
      return NextResponse.json({ message: "Payment already processed" })
    }

    // Record payment
    const monthYear = new Date(payload.transactionDate).toISOString().slice(0, 7)

    await sql`
      INSERT INTO payments (
        lease_id, tenant_id, amount, payment_date, payment_method,
        transaction_reference, jenga_transaction_id, payment_type, status, month_year
      )
      VALUES (
        ${leaseId},
        ${tenantId},
        ${payload.amount},
        ${payload.transactionDate},
        'jenga_pgw',
        ${payload.transactionReference},
        ${payload.transactionReference},
        'rent',
        'completed',
        ${monthYear}
      )
    `

    // Update payment status
    await updatePaymentStatus(leaseId, roomId, monthYear)

    // Mark IPN as processed
    await sql`
      UPDATE ipn_logs
      SET processed = true, processed_at = CURRENT_TIMESTAMP
      WHERE id = ${ipnLogId}
    `

    return NextResponse.json({ message: "Payment processed successfully" })
  } catch (error: any) {
    console.error("[v0] Jenga IPN Error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
