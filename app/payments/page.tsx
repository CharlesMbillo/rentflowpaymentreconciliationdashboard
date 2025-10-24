"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PaymentsTable } from "@/components/payments/payments-table"
import { PaymentStats } from "@/components/payments/payment-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { Payment } from "@/lib/actions/payments"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState({
    total_payments: 0,
    total_amount: 0,
    completed_payments: 0,
    pending_payments: 0,
    failed_payments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [paymentsRes, summaryRes] = await Promise.all([fetch("/api/payments"), fetch("/api/payments/summary")])

        if (!paymentsRes.ok || !summaryRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const paymentsData = await paymentsRes.json()
        const summaryData = await summaryRes.json()

        setPayments(paymentsData || [])
        setSummary(
          summaryData || {
            total_payments: 0,
            total_amount: 0,
            completed_payments: 0,
            pending_payments: 0,
            failed_payments: 0,
          },
        )
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground">Track and reconcile rent payments</p>
          </div>
          <Button asChild>
            <Link href="/payments/record">
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Link>
          </Button>
        </div>

        <PaymentStats summary={summary} />
        <PaymentsTable payments={payments} />
      </main>
    </div>
  )
}
