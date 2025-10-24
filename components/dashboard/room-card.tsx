"use client"

import type { Room } from "@/lib/actions/rooms"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import { RoomDetailsDialog } from "./room-details-dialog"

interface RoomCardProps {
  room: Room
}

export function RoomCard({ room }: RoomCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusColor = () => {
    switch (room.payment_status) {
      case "paid":
        return "bg-green-500 hover:bg-green-600"
      case "partial":
        return "bg-amber-500 hover:bg-amber-600"
      case "overdue":
        return "bg-red-500 hover:bg-red-600"
      case "pending":
        return "bg-blue-500 hover:bg-blue-600"
      case "vacant":
        return "bg-gray-400 hover:bg-gray-500"
      default:
        return "bg-gray-300 hover:bg-gray-400"
    }
  }

  const getStatusLabel = () => {
    switch (room.payment_status) {
      case "paid":
        return "Paid"
      case "partial":
        return "Partial Payment"
      case "overdue":
        return "Overdue"
      case "pending":
        return "Pending"
      case "vacant":
        return "Vacant"
      default:
        return "Unknown"
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowDetails(true)}
              className={cn(
                "aspect-square rounded text-white text-xs font-medium transition-colors",
                "flex items-center justify-center",
                getStatusColor(),
              )}
            >
              {room.room_number}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Room {room.room_number}</p>
              <p className="text-xs">Status: {getStatusLabel()}</p>
              {room.tenant_name && <p className="text-xs">Tenant: {room.tenant_name}</p>}
              {room.payment_status === "partial" && (
                <p className="text-xs">
                  Paid: KES {room.paid_amount?.toLocaleString()} / {room.expected_amount?.toLocaleString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <RoomDetailsDialog roomId={room.id} open={showDetails} onOpenChange={setShowDetails} />
    </>
  )
}
