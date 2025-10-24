"use client"

import type { TenantWithLease } from "@/lib/actions/tenants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Mail, Phone, Briefcase, Building2 } from "lucide-react"

interface TenantDetailsProps {
  tenant: TenantWithLease
}

export function TenantDetails({ tenant }: TenantDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Information</CardTitle>
        <CardDescription>Personal and contact details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">KYC Status</span>
          {tenant.kyc_verified ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              Pending Verification
            </Badge>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{tenant.email || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">{tenant.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Emergency Contact</p>
              <p className="text-sm text-muted-foreground">{tenant.emergency_contact || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Occupation</p>
              <p className="text-sm text-muted-foreground">{tenant.occupation || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Employer</p>
              <p className="text-sm text-muted-foreground">{tenant.employer || "Not provided"}</p>
            </div>
          </div>
        </div>

        {tenant.lease_id && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Current Lease</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Room</span>
                  <span className="text-sm font-medium">
                    Block {tenant.block_name} - {tenant.room_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Rent</span>
                  <span className="text-sm font-medium">KES {tenant.monthly_rent?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <span className="text-sm font-medium">
                    {tenant.lease_start_date ? new Date(tenant.lease_start_date).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={tenant.lease_status === "active" ? "default" : "secondary"}>
                    {tenant.lease_status}
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
