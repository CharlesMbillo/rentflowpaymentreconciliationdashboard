"use client"

import type { TenantWithLease } from "@/lib/actions/tenants"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TenantsTableProps {
  tenants: TenantWithLease[]
}

export function TenantsTable({ tenants }: TenantsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Tenants</CardTitle>
        <CardDescription>
          {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} registered
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Lease Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No tenants found
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.full_name}</TableCell>
                  <TableCell>{tenant.id_number}</TableCell>
                  <TableCell>{tenant.phone}</TableCell>
                  <TableCell>
                    {tenant.room_number ? (
                      <span>
                        Block {tenant.block_name} - {tenant.room_number}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No room assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.kyc_verified ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.lease_status ? (
                      <Badge variant={tenant.lease_status === "active" ? "default" : "secondary"}>
                        {tenant.lease_status}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No lease</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tenants/${tenant.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
