"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy } from "lucide-react"

interface TopTenantsProps {
  tenants: any[]
}

export function TopTenants({ tenants }: TopTenantsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top Paying Tenants
        </CardTitle>
        <CardDescription>Tenants with highest total payments</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="text-right">Total Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant, index) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{tenant.full_name}</TableCell>
                <TableCell>
                  {tenant.block_name && tenant.room_number ? (
                    <span>
                      Block {tenant.block_name} - {tenant.room_number}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  KES {Number(tenant.total_paid).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
