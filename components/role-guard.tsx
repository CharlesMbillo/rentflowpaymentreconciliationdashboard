"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { type UserRole, hasRole, hasMinimumRole } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  minimumRole?: UserRole
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, minimumRole, fallback }: RoleGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (!user) {
    return (
      fallback || (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You must be logged in to access this content.</AlertDescription>
        </Alert>
      )
    )
  }

  // Check role permissions
  const hasPermission = allowedRoles
    ? hasRole(user, allowedRoles)
    : minimumRole
      ? hasMinimumRole(user, minimumRole)
      : true

  if (!hasPermission) {
    return (
      fallback || (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this content. Required role: {minimumRole || allowedRoles?.join(", ")}
          </AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}
