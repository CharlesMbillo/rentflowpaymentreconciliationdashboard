"use client"

import type { AuditLog } from "@/lib/actions/audit"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface AuditLogTableProps {
  logs: AuditLog[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "default"
      case "update":
        return "secondary"
      case "delete":
        return "destructive"
      case "login":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="max-h-[600px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>Entity ID</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No audit logs found
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">{new Date(log.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium">{log.user_name || "System"}</p>
                    <p className="text-xs text-muted-foreground">{log.user_email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                </TableCell>
                <TableCell className="capitalize">{log.entity_type}</TableCell>
                <TableCell>{log.entity_id || "N/A"}</TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                  {log.new_value ? JSON.stringify(log.new_value).substring(0, 50) + "..." : "N/A"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
