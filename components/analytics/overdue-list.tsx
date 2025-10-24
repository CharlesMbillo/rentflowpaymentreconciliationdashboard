"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface OverdueListProps {
  overduePayments: any[]
}

export function OverdueList({ overduePayments }: OverdueListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Overdue Payments
        </CardTitle>
        <CardDescription>Payments requiring immediate attention</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overduePayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No overdue payments
                </TableCell>
              </TableRow>
            ) : (
              overduePayments.slice(0, 10).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.tenant_name}</TableCell>
                  <TableCell>
                    Block {payment.block_name} - {payment.room_number}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{new Date(payment.due_date).toLocaleDateString()}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    KES {Number(payment.amount_due).toLocaleString()}
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
