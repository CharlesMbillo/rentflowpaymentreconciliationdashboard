"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export interface MonthlyRevenue {
  month_year: string
  total_revenue: number
  expected_revenue: number
  collection_rate: number
}

export interface BlockOccupancy {
  block_name: string
  total_rooms: number
  occupied_rooms: number
  vacant_rooms: number
  occupancy_rate: number
}

export interface PaymentTrend {
  month_year: string
  paid: number
  partial: number
  overdue: number
  pending: number
}

export async function getMonthlyRevenue(months = 6): Promise<MonthlyRevenue[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const revenue = await sql`
    WITH monthly_data AS (
      SELECT 
        ps.month_year,
        SUM(ps.paid_amount) as total_revenue,
        SUM(ps.expected_amount) as expected_revenue
      FROM payment_status ps
      WHERE ps.month_year >= TO_CHAR(CURRENT_DATE - INTERVAL '1 month' * ${months}, 'YYYY-MM')
      GROUP BY ps.month_year
      ORDER BY ps.month_year DESC
    )
    SELECT 
      month_year,
      total_revenue,
      expected_revenue,
      CASE 
        WHEN expected_revenue > 0 THEN (total_revenue / expected_revenue * 100)
        ELSE 0 
      END as collection_rate
    FROM monthly_data
  `

  return revenue as MonthlyRevenue[]
}

export async function getBlockOccupancy(): Promise<BlockOccupancy[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const occupancy = await sql`
    SELECT 
      b.name as block_name,
      COUNT(r.id) as total_rooms,
      COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms,
      COUNT(CASE WHEN r.status = 'vacant' THEN 1 END) as vacant_rooms,
      CASE 
        WHEN COUNT(r.id) > 0 THEN (COUNT(CASE WHEN r.status = 'occupied' THEN 1 END)::float / COUNT(r.id) * 100)
        ELSE 0 
      END as occupancy_rate
    FROM blocks b
    LEFT JOIN rooms r ON b.id = r.block_id
    GROUP BY b.id, b.name
    ORDER BY b.name
  `

  return occupancy as BlockOccupancy[]
}

export async function getPaymentTrends(months = 6): Promise<PaymentTrend[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const trends = await sql`
    SELECT 
      ps.month_year,
      COUNT(CASE WHEN ps.status = 'paid' THEN 1 END) as paid,
      COUNT(CASE WHEN ps.status = 'partial' THEN 1 END) as partial,
      COUNT(CASE WHEN ps.status = 'overdue' THEN 1 END) as overdue,
      COUNT(CASE WHEN ps.status = 'pending' THEN 1 END) as pending
    FROM payment_status ps
    WHERE ps.month_year >= TO_CHAR(CURRENT_DATE - INTERVAL '1 month' * ${months}, 'YYYY-MM')
    GROUP BY ps.month_year
    ORDER BY ps.month_year DESC
  `

  return trends as PaymentTrend[]
}

export async function getTopPayingTenants(limit = 10) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const topTenants = await sql`
    SELECT 
      t.id,
      t.full_name,
      t.phone,
      r.room_number,
      b.name as block_name,
      SUM(p.amount) as total_paid,
      COUNT(p.id) as payment_count
    FROM tenants t
    JOIN payments p ON t.id = p.tenant_id
    LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
    LEFT JOIN rooms r ON l.room_id = r.id
    LEFT JOIN blocks b ON r.block_id = b.id
    WHERE p.status = 'completed'
    GROUP BY t.id, t.full_name, t.phone, r.room_number, b.name
    ORDER BY total_paid DESC
    LIMIT ${limit}
  `

  return topTenants
}

export async function getOverduePayments() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const overdue = await sql`
    SELECT 
      ps.id,
      ps.month_year,
      ps.expected_amount,
      ps.paid_amount,
      ps.due_date,
      t.full_name as tenant_name,
      t.phone as tenant_phone,
      r.room_number,
      b.name as block_name,
      (ps.expected_amount - ps.paid_amount) as amount_due
    FROM payment_status ps
    JOIN leases l ON ps.lease_id = l.id
    JOIN tenants t ON l.tenant_id = t.id
    JOIN rooms r ON ps.room_id = r.id
    JOIN blocks b ON r.block_id = b.id
    WHERE ps.status IN ('overdue', 'partial')
    ORDER BY ps.due_date ASC
    LIMIT 50
  `

  return overdue
}

export async function getAnalyticsSummary() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const summary = await sql`
    SELECT
      (SELECT COUNT(*) FROM rooms WHERE status = 'occupied') as total_occupied,
      (SELECT COUNT(*) FROM rooms WHERE status = 'vacant') as total_vacant,
      (SELECT COUNT(*) FROM tenants) as total_tenants,
      (SELECT COUNT(*) FROM leases WHERE status = 'active') as active_leases,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as current_month_revenue,
      (SELECT COALESCE(SUM(expected_amount), 0) FROM payment_status WHERE month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as expected_month_revenue,
      (SELECT COUNT(*) FROM payment_status WHERE status = 'overdue') as overdue_count
  `

  return summary[0]
}
