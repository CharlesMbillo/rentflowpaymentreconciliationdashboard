"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

export interface Payment {
  id: number
  lease_id: number
  tenant_id: number
  amount: number
  payment_date: string
  payment_method: string
  transaction_reference: string
  jenga_transaction_id: string | null
  payment_type: string
  status: string
  month_year: string | null
  created_at: string
  tenant_name?: string
  room_number?: string
  block_name?: string
}

export async function getPayments(filters?: {
  status?: string
  month_year?: string
  tenant_id?: number
}): Promise<Payment[]> {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    let query = `
      SELECT 
        p.*,
        t.full_name as tenant_name,
        r.room_number,
        b.name as block_name
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN leases l ON p.lease_id = l.id
      LEFT JOIN rooms r ON l.room_id = r.id
      LEFT JOIN blocks b ON r.block_id = b.id
      WHERE 1=1
    `

    const params: any[] = []

    if (filters?.status) {
      params.push(filters.status)
      query += ` AND p.status = $${params.length}`
    }

    if (filters?.month_year) {
      params.push(filters.month_year)
      query += ` AND p.month_year = $${params.length}`
    }

    if (filters?.tenant_id) {
      params.push(filters.tenant_id)
      query += ` AND p.tenant_id = $${params.length}`
    }

    query += " ORDER BY p.payment_date DESC LIMIT 100"

    console.log("[v0] Executing payments query with params:", params)
    const result = await sql.query(query, params)
    console.log("[v0] Query result:", result)

    if (!result || !result.rows) {
      console.log("[v0] No rows returned from query")
      return []
    }

    return result.rows as Payment[]
  } catch (error) {
    console.error("[v0] Error fetching payments:", error)
    return []
  }
}

export async function recordPayment(data: {
  lease_id: number
  amount: number
  payment_date: string
  payment_method: string
  transaction_reference: string
  payment_type?: string
  month_year?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Get lease details
  const lease = await sql`
    SELECT l.*, r.id as room_id, l.tenant_id
    FROM leases l
    JOIN rooms r ON l.room_id = r.id
    WHERE l.id = ${data.lease_id}
    LIMIT 1
  `

  if (lease.length === 0) {
    throw new Error("Lease not found")
  }

  const monthYear = data.month_year || new Date(data.payment_date).toISOString().slice(0, 7)

  // Record payment
  const payment = await sql`
    INSERT INTO payments (
      lease_id, tenant_id, amount, payment_date, payment_method,
      transaction_reference, payment_type, status, month_year
    )
    VALUES (
      ${data.lease_id},
      ${lease[0].tenant_id},
      ${data.amount},
      ${data.payment_date},
      ${data.payment_method},
      ${data.transaction_reference},
      ${data.payment_type || "rent"},
      'completed',
      ${monthYear}
    )
    RETURNING *
  `

  // Update payment status
  await updatePaymentStatus(data.lease_id, lease[0].room_id, monthYear)

  // Log audit trail
  await sql`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
    VALUES (
      ${user.id},
      'create',
      'payment',
      ${payment[0].id},
      ${JSON.stringify(payment[0])}
    )
  `

  revalidatePath("/payments")
  revalidatePath("/dashboard")
  return payment[0]
}

export async function updatePaymentStatus(leaseId: number, roomId: number, monthYear: string) {
  // Calculate total paid for the month
  const payments = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_paid
    FROM payments
    WHERE lease_id = ${leaseId}
      AND month_year = ${monthYear}
      AND status = 'completed'
  `

  const totalPaid = Number(payments[0].total_paid)

  // Get expected amount
  const lease = await sql`
    SELECT monthly_rent FROM leases WHERE id = ${leaseId}
  `

  const expectedAmount = Number(lease[0].monthly_rent)

  // Determine status
  let status = "pending"
  if (totalPaid >= expectedAmount) {
    status = "paid"
  } else if (totalPaid > 0) {
    status = "partial"
  } else {
    // Check if overdue
    const paymentStatus = await sql`
      SELECT due_date FROM payment_status
      WHERE lease_id = ${leaseId} AND month_year = ${monthYear}
    `
    if (paymentStatus.length > 0 && new Date() > new Date(paymentStatus[0].due_date)) {
      status = "overdue"
    }
  }

  // Update or create payment status
  await sql`
    INSERT INTO payment_status (lease_id, room_id, month_year, expected_amount, paid_amount, status, due_date, last_payment_date)
    VALUES (
      ${leaseId},
      ${roomId},
      ${monthYear},
      ${expectedAmount},
      ${totalPaid},
      ${status},
      (DATE_TRUNC('month', ${monthYear}::date) + INTERVAL '4 days')::date,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (lease_id, month_year)
    DO UPDATE SET
      paid_amount = ${totalPaid},
      status = ${status},
      last_payment_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `

  revalidatePath("/dashboard")
}

export async function getPaymentSummary(monthYear?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const currentMonth = monthYear || new Date().toISOString().slice(0, 7)

  const summary = await sql`
    SELECT
      COUNT(*) as total_payments,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments
    FROM payments
    WHERE month_year = ${currentMonth}
  `

  return summary[0]
}
