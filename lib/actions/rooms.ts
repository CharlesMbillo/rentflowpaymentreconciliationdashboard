"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export interface Block {
  id: number
  name: string
  total_floors: number
  rooms_per_floor: number
  total_rooms: number
}

export interface Room {
  id: number
  room_number: string
  floor_number: number
  status: "vacant" | "occupied" | "maintenance"
  rent_amount: number
  payment_status?: "paid" | "partial" | "overdue" | "pending" | "vacant"
  tenant_name?: string
  tenant_id?: number
  lease_id?: number
  paid_amount?: number
  expected_amount?: number
  due_date?: string
}

export interface RoomMatrixData {
  blocks: Block[]
  rooms: Record<number, Room[]> // blockId -> rooms
  summary: {
    total_rooms: number
    occupied: number
    vacant: number
    paid: number
    partial: number
    overdue: number
    pending: number
  }
}

export async function getBlocks(): Promise<Block[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const blocks = await sql`
    SELECT id, name, total_floors, rooms_per_floor, total_rooms
    FROM blocks
    ORDER BY name
  `

  return blocks as Block[]
}

export async function getRoomsByBlock(blockId: number, monthYear?: string): Promise<Room[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const currentMonthYear = monthYear || new Date().toISOString().slice(0, 7)

  const rooms = await sql`
    SELECT 
      r.id,
      r.room_number,
      r.floor_number,
      r.status,
      r.rent_amount,
      t.full_name as tenant_name,
      t.id as tenant_id,
      l.id as lease_id,
      ps.status as payment_status,
      ps.paid_amount,
      ps.expected_amount,
      ps.due_date
    FROM rooms r
    LEFT JOIN leases l ON r.id = l.room_id AND l.status = 'active'
    LEFT JOIN tenants t ON l.tenant_id = t.id
    LEFT JOIN payment_status ps ON l.id = ps.lease_id AND ps.month_year = ${currentMonthYear}
    WHERE r.block_id = ${blockId}
    ORDER BY r.floor_number DESC, r.room_number
  `

  return rooms.map((room) => ({
    ...room,
    payment_status: room.status === "vacant" ? "vacant" : room.payment_status || "pending",
  })) as Room[]
}

export async function getRoomMatrixData(monthYear?: string): Promise<RoomMatrixData> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const currentMonthYear = monthYear || new Date().toISOString().slice(0, 7)

  // Get all blocks
  const blocks = await getBlocks()

  // Get rooms for all blocks
  const roomsData: Record<number, Room[]> = {}
  for (const block of blocks) {
    roomsData[block.id] = await getRoomsByBlock(block.id, currentMonthYear)
  }

  // Calculate summary
  const allRooms = Object.values(roomsData).flat()
  const summary = {
    total_rooms: allRooms.length,
    occupied: allRooms.filter((r) => r.status === "occupied").length,
    vacant: allRooms.filter((r) => r.status === "vacant").length,
    paid: allRooms.filter((r) => r.payment_status === "paid").length,
    partial: allRooms.filter((r) => r.payment_status === "partial").length,
    overdue: allRooms.filter((r) => r.payment_status === "overdue").length,
    pending: allRooms.filter((r) => r.payment_status === "pending" && r.status === "occupied").length,
  }

  return {
    blocks,
    rooms: roomsData,
    summary,
  }
}

export async function getRoomDetails(roomId: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const result = await sql`
    SELECT 
      r.*,
      b.name as block_name,
      t.id as tenant_id,
      t.full_name as tenant_name,
      t.email as tenant_email,
      t.phone as tenant_phone,
      l.id as lease_id,
      l.start_date,
      l.end_date,
      l.monthly_rent,
      l.deposit_paid,
      l.status as lease_status
    FROM rooms r
    JOIN blocks b ON r.block_id = b.id
    LEFT JOIN leases l ON r.id = l.room_id AND l.status = 'active'
    LEFT JOIN tenants t ON l.tenant_id = t.id
    WHERE r.id = ${roomId}
    LIMIT 1
  `

  if (result.length === 0) return null

  return result[0]
}
