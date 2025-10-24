"use client"

import { useEffect, useState } from "react"
import { getRoomDetails } from "@/lib/actions/rooms"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

interface RoomDetailsDialogProps {
  roomId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomDetailsDialog({ roomId, open, onOpenChange }: RoomDetailsDialogProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && roomId) {
      setLoading(true)
      getRoomDetails(roomId)
        .then(setDetails)
        .finally(() => setLoading(false))
    }
  }, [open, roomId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Room Details</DialogTitle>
          <DialogDescription>Detailed information about the room and current tenant</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Room Number</p>
                <p className="text-lg font-semibold">
                  Block {details.block_name} - Room {details.room_number}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Floor</p>
                <p className="text-lg font-semibold">Floor {details.floor_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={details.status === "occupied" ? "default" : "secondary"}>{details.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                <p className="text-lg font-semibold">KES {details.rent_amount?.toLocaleString()}</p>
              </div>
            </div>

            {details.tenant_name && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Current Tenant</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p>{details.tenant_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm">{details.tenant_email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p>{details.tenant_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lease Status</p>
                      <Badge>{details.lease_status}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Lease Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p>{new Date(details.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">End Date</p>
                      <p>{details.end_date ? new Date(details.end_date).toLocaleDateString() : "Ongoing"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Deposit Paid</p>
                      <p>KES {details.deposit_paid?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                      <p>KES {details.monthly_rent?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No details available</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
