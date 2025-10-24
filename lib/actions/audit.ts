"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export interface AuditLog {
  id: number
  user_id: number | null
  action: string
  entity_type: string
  entity_id: number | null
  old_value: any
  new_value: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user_name?: string
  user_email?: string
}

export async function getAuditLogs(filters?: {
  entity_type?: string
  action?: string
  user_id?: number
  limit?: number
}): Promise<AuditLog[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  let query = `
    SELECT 
      al.*,
      u.full_name as user_name,
      u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `

  const params: any[] = []

  if (filters?.entity_type) {
    params.push(filters.entity_type)
    query += ` AND al.entity_type = $${params.length}`
  }

  if (filters?.action) {
    params.push(filters.action)
    query += ` AND al.action = $${params.length}`
  }

  if (filters?.user_id) {
    params.push(filters.user_id)
    query += ` AND al.user_id = $${params.length}`
  }

  query += ` ORDER BY al.created_at DESC LIMIT ${filters?.limit || 100}`

  const logs = await sql(query, params)
  return logs as AuditLog[]
}

export async function getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const logs = await sql`
    SELECT 
      al.*,
      u.full_name as user_name,
      u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.entity_type = ${entityType} AND al.entity_id = ${entityId}
    ORDER BY al.created_at DESC
  `

  return logs as AuditLog[]
}

export async function getRecentActivity(limit = 20) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const activity = await sql`
    SELECT 
      al.*,
      u.full_name as user_name,
      u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ${limit}
  `

  return activity as AuditLog[]
}
