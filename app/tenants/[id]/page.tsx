"use client"

import { useEffect, useState } from "react"
import { getTenantById, getAvailableRooms } from "@/lib/actions/tenants"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TenantDetails } from "@/components/tenants/tenant-details"
import { CreateLeaseForm } from "@/components/tenants/create-lease-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"

export const dynamic = "force-dynamic"

export default function TenantDetailPage() {
  const params = useParams()
  const [tenant, setTenant] = useState<any>(null)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const tenantData = await getTenantById(Number.parseInt(params.id as string))
        setTenant(tenantData)

        if (tenantData && !tenantData.lease_id) {
          const rooms = await getAvailableRooms()
          setAvailableRooms(rooms)
        }
      } catch (error) {
        console.error("Error fetching tenant:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading tenant details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Tenant not found</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6 max-w-6xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tenant.full_name}</h1>
            <p className="text-muted-foreground">Tenant ID: {tenant.id_number}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TenantDetails tenant={tenant} />

          {!tenant.lease_id && (
            <Card>
              <CardHeader>
                <CardTitle>Create Lease</CardTitle>
                <CardDescription>Assign this tenant to a room</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateLeaseForm tenantId={tenant.id} availableRooms={availableRooms} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
