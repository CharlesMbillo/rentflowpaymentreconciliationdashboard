"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { recordPayment } from "@/lib/actions/payments"
import { getTenants } from "@/lib/actions/tenants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function RecordPaymentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<any>(null)

  useEffect(() => {
    getTenants().then((data) => {
      // Only show tenants with active leases
      const tenantsWithLeases = data.filter((t) => t.lease_id)
      setTenants(tenantsWithLeases)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      lease_id: Number.parseInt(formData.get("lease_id") as string),
      amount: Number.parseFloat(formData.get("amount") as string),
      payment_date: formData.get("payment_date") as string,
      payment_method: formData.get("payment_method") as string,
      transaction_reference: formData.get("transaction_reference") as string,
      month_year: formData.get("month_year") as string,
    }

    try {
      await recordPayment(data)
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      })
      router.push("/payments")
    } catch (err: any) {
      setError(err.message || "Failed to record payment")
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
        <Label htmlFor="lease_id">
          Select Tenant <span className="text-red-500">*</span>
        </Label>
        <Select
          name="lease_id"
          required
          disabled={loading}
          onValueChange={(value) => {
            const tenant = tenants.find((t) => t.lease_id?.toString() === value)
            setSelectedTenant(tenant)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a tenant" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.lease_id} value={tenant.lease_id.toString()}>
                {tenant.full_name} - Block {tenant.block_name} Room {tenant.room_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount (KES) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            placeholder="7500.00"
            defaultValue={selectedTenant?.monthly_rent || ""}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_date">
            Payment Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="payment_date"
            name="payment_date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">
          Payment Method <span className="text-red-500">*</span>
        </Label>
        <Select name="payment_method" required disabled={loading} defaultValue="mpesa">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="jenga_pgw">Jenga PGW</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_reference">
          Transaction Reference <span className="text-red-500">*</span>
        </Label>
        <Input
          id="transaction_reference"
          name="transaction_reference"
          placeholder="TXN123456789"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="month_year">Month/Year (YYYY-MM)</Label>
        <Input
          id="month_year"
          name="month_year"
          type="month"
          defaultValue={new Date().toISOString().slice(0, 7)}
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Recording Payment...
          </>
        ) : (
          "Record Payment"
        )}
      </Button>
    </form>
  )
}
