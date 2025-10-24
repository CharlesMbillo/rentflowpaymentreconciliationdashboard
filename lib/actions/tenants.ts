"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

export interface Tenant {
  id: number
  id_number: string
  full_name: string
  email: string | null
  phone: string
  emergency_contact: string | null
  occupation: string | null
  employer: string | null
  kyc_verified: boolean
  kyc_document_url: string | null
  created_at: string
  updated_at: string
}

export interface TenantWithLease extends Tenant {
  lease_id?: number
  room_number?: string
  block_name?: string
  monthly_rent?: number
  lease_status?: string
  lease_start_date?: string
  lease_end_date?: string
}

export async function getTenants(): Promise<TenantWithLease[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const tenants = await sql`
    SELECT 
      t.*,
      l.id as lease_id,
      r.room_number,
      b.name as block_name,
      l.monthly_rent,
      l.status as lease_status,
      l.start_date as lease_start_date,
      l.end_date as lease_end_date
    FROM tenants t
    LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
    LEFT JOIN rooms r ON l.room_id = r.id
    LEFT JOIN blocks b ON r.block_id = b.id
    ORDER BY t.created_at DESC
  `

  return tenants as TenantWithLease[]
}

export async function getTenantById(id: number): Promise<TenantWithLease | null> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const result = await sql`
    SELECT 
      t.*,
      l.id as lease_id,
      r.room_number,
      r.id as room_id,
      b.name as block_name,
      l.monthly_rent,
      l.status as lease_status,
      l.start_date as lease_start_date,
      l.end_date as lease_end_date,
      l.deposit_paid
    FROM tenants t
    LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
    LEFT JOIN rooms r ON l.room_id = r.id
    LEFT JOIN blocks b ON r.block_id = b.id
    WHERE t.id = ${id}
    LIMIT 1
  `

  if (result.length === 0) return null
  return result[0] as TenantWithLease
}

export async function createTenant(data: {
  id_number: string
  full_name: string
  email?: string
  phone: string
  emergency_contact?: string
  occupation?: string
  employer?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  console.log("[v0] Creating tenant with user:", user)
  console.log("[v0] User ID type:", typeof user.id, "Value:", user.id)

  // Check if ID number already exists
  const existing = await sql`
    SELECT id FROM tenants WHERE id_number = ${data.id_number}
  `

  if (existing.length > 0) {
    throw new Error("A tenant with this ID number already exists")
  }

  const result = await sql`
    INSERT INTO tenants (
      id_number, full_name, email, phone, emergency_contact, occupation, employer
    )
    VALUES (
      ${data.id_number},
      ${data.full_name},
      ${data.email || null},
      ${data.phone},
      ${data.emergency_contact || null},
      ${data.occupation || null},
      ${data.employer || null}
    )
    RETURNING *
  `

  console.log("[v0] Tenant created:", result[0])
  console.log("[v0] Tenant ID:", result[0].id, "Type:", typeof result[0].id)

  const userId = Number(user.id)
  const tenantId = Number(result[0].id)

  console.log("[v0] Inserting audit log with userId:", userId, "tenantId:", tenantId)

  // Log audit trail
  await sql`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
    VALUES (
      ${userId},
      'create',
      'tenant',
      ${tenantId},
      ${JSON.stringify(result[0])}
    )
  `

  revalidatePath("/tenants")
  return result[0]
}

export async function updateTenant(
  id: number,
  data: {
    full_name?: string
    email?: string
    phone?: string
    emergency_contact?: string
    occupation?: string
    employer?: string
    kyc_verified?: boolean
  },
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Get old values for audit
  const oldData = await sql`SELECT * FROM tenants WHERE id = ${id}`

  const result = await sql`
    UPDATE tenants
    SET
      full_name = COALESCE(${data.full_name}, full_name),
      email = COALESCE(${data.email}, email),
      phone = COALESCE(${data.phone}, phone),
      emergency_contact = COALESCE(${data.emergency_contact}, emergency_contact),
      occupation = COALESCE(${data.occupation}, occupation),
      employer = COALESCE(${data.employer}, employer),
      kyc_verified = COALESCE(${data.kyc_verified}, kyc_verified),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `

  // Log audit trail
  await sql`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (
      ${user.id},
      'update',
      'tenant',
      ${id},
      ${JSON.stringify(oldData[0])},
      ${JSON.stringify(result[0])}
    )
  `

  revalidatePath("/tenants")
  return result[0]
}

export async function createLease(data: {
  tenant_id: number
  room_id: number
  start_date: string
  end_date?: string
  monthly_rent: number
  deposit_paid: number
  payment_day?: number
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Check if room is available
  const room = await sql`
    SELECT id, status FROM rooms WHERE id = ${data.room_id}
  `

  if (room.length === 0) {
    throw new Error("Room not found")
  }

  if (room[0].status === "occupied") {
    throw new Error("Room is already occupied")
  }

  // Check if tenant already has an active lease
  const existingLease = await sql`
    SELECT id FROM leases WHERE tenant_id = ${data.tenant_id} AND status = 'active'
  `

  if (existingLease.length > 0) {
    throw new Error("Tenant already has an active lease")
  }

  // Create lease
  const lease = await sql`
    INSERT INTO leases (
      tenant_id, room_id, start_date, end_date, monthly_rent, deposit_paid, status, payment_day
    )
    VALUES (
      ${data.tenant_id},
      ${data.room_id},
      ${data.start_date},
      ${data.end_date || null},
      ${data.monthly_rent},
      ${data.deposit_paid},
      'active',
      ${data.payment_day || 5}
    )
    RETURNING *
  `

  // Update room status
  await sql`
    UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP
    WHERE id = ${data.room_id}
  `

  // Create payment status for current month
  const currentMonth = new Date().toISOString().slice(0, 7)
  const dueDate = new Date()
  dueDate.setDate(data.payment_day || 5)

  await sql`
    INSERT INTO payment_status (lease_id, room_id, month_year, expected_amount, paid_amount, status, due_date)
    VALUES (
      ${lease[0].id},
      ${data.room_id},
      ${currentMonth},
      ${data.monthly_rent},
      0,
      ${new Date() > dueDate ? "overdue" : "pending"},
      ${dueDate.toISOString().split("T")[0]}
    )
  `

  // Log audit trail
  await sql`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
    VALUES (
      ${user.id},
      'create',
      'lease',
      ${lease[0].id},
      ${JSON.stringify(lease[0])}
    )
  `

  revalidatePath("/tenants")
  revalidatePath("/dashboard")
  return lease[0]
}

export async function getAvailableRooms() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const rooms = await sql`
    SELECT 
      r.id,
      r.room_number,
      r.floor_number,
      r.rent_amount,
      r.deposit_amount,
      b.name as block_name
    FROM rooms r
    JOIN blocks b ON r.block_id = b.id
    WHERE r.status = 'vacant'
    ORDER BY b.name, r.floor_number, r.room_number
  `

  return rooms
}
