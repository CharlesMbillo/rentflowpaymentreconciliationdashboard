"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function syncOfflineActions(actions: any[]) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const results = []

  for (const action of actions) {
    try {
      // Store in offline queue table
      await sql`
        INSERT INTO offline_queue (action_type, payload, synced)
        VALUES (${action.type}, ${JSON.stringify(action.payload)}, true)
      `

      results.push({ id: action.id, success: true })
    } catch (error: any) {
      results.push({ id: action.id, success: false, error: error.message })
    }
  }

  return results
}

export async function getLastSyncTime() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const result = await sql`
    SELECT MAX(created_at) as last_sync
    FROM offline_queue
    WHERE synced = true
  `

  return result[0]?.last_sync || null
}
