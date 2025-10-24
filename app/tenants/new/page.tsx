"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TenantOnboardingForm } from "@/components/tenants/tenant-onboarding-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function NewTenantPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Tenant</h1>
            <p className="text-muted-foreground">Complete tenant information and KYC verification</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Onboarding</CardTitle>
            <CardDescription>Fill in the tenant details to create a new record</CardDescription>
          </CardHeader>
          <CardContent>
            <TenantOnboardingForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
