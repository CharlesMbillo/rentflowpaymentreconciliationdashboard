"use client"

import type { Block, Room } from "@/lib/actions/rooms"
import { RoomCard } from "./room-card"

interface RoomGridProps {
  block: Block
  rooms: Room[]
}

export function RoomGrid({ block, rooms }: RoomGridProps) {
  // Group rooms by floor
  const roomsByFloor: Record<number, Room[]> = {}
  rooms.forEach((room) => {
    if (!roomsByFloor[room.floor_number]) {
      roomsByFloor[room.floor_number] = []
    }
    roomsByFloor[room.floor_number].push(room)
  })

  // Get floors in descending order (top floor first)
  const floors = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Block {block.name} - {block.total_rooms} rooms across {block.total_floors} floors
        </span>
        <span>{block.rooms_per_floor} rooms per floor (standard)</span>
      </div>

      <div className="space-y-3">
        {floors.map((floor) => (
          <div key={floor} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-16">Floor {floor}</span>
              <div className="flex-1 grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-21 gap-1">
                {roomsByFloor[floor].map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
