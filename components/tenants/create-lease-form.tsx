"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createLease } from "@/lib/actions/tenants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateLeaseFormProps {
  tenantId: number
  availableRooms: any[]
}

export function CreateLeaseForm({ tenantId, availableRooms }: CreateLeaseFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      tenant_id: tenantId,
      room_id: Number.parseInt(formData.get("room_id") as string),
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      monthly_rent: Number.parseFloat(formData.get("monthly_rent") as string),
      deposit_paid: Number.parseFloat(formData.get("deposit_paid") as string),
      payment_day: Number.parseInt(formData.get("payment_day") as string),
    }

    try {
      await createLease(data)
      toast({
        title: "Success",
        description: "Lease created successfully",
      })
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to create lease")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="room_id">
          Select Room <span className="text-red-500">*</span>
        </Label>
        <Select
          name="room_id"
          required
          disabled={loading}
          onValueChange={(value) => {
            const room = availableRooms.find((r) => r.id.toString() === value)
            setSelectedRoom(room)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a room" />
          </SelectTrigger>
          <SelectContent>
            {availableRooms.map((room) => (
              <SelectItem key={room.id} value={room.id.toString()}>
                Block {room.block_name} - Room {room.room_number} (Floor {room.floor_number}) - KES{" "}
                {room.rent_amount.toLocaleString()}/month
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input id="start_date" name="start_date" type="date" required disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">End Date (Optional)</Label>
          <Input id="end_date" name="end_date" type="date" disabled={loading} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly_rent">
            Monthly Rent <span className="text-red-500">*</span>
          </Label>
          <Input
            id="monthly_rent"
            name="monthly_rent"
            type="number"
            step="0.01"
            placeholder="7500.00"
            defaultValue={selectedRoom?.rent_amount || ""}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deposit_paid">
            Deposit Paid <span className="text-red-500">*</span>
          </Label>
          <Input
            id="deposit_paid"
            name="deposit_paid"
            type="number"
            step="0.01"
            placeholder="15000.00"
            defaultValue={selectedRoom?.deposit_amount || ""}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_day">Payment Due Day (1-31)</Label>
        <Input id="payment_day" name="payment_day" type="number" min="1" max="31" defaultValue="5" disabled={loading} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Lease...
          </>
        ) : (
          "Create Lease"
        )}
      </Button>
    </form>
  )
}
