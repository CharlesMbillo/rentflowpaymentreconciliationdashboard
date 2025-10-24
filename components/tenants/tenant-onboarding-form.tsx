"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTenant } from "@/lib/actions/tenants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TenantOnboardingForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      id_number: formData.get("id_number") as string,
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      emergency_contact: formData.get("emergency_contact") as string,
      occupation: formData.get("occupation") as string,
      employer: formData.get("employer") as string,
    }

    try {
      const tenant = await createTenant(data)
      toast({
        title: "Success",
        description: "Tenant created successfully",
      })
      router.push(`/tenants/${tenant.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to create tenant")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input id="full_name" name="full_name" placeholder="John Doe" required disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_number">
            ID Number <span className="text-red-500">*</span>
          </Label>
          <Input id="id_number" name="id_number" placeholder="12345678" required disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input id="phone" name="phone" type="tel" placeholder="+254712345678" required disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="john@example.com" disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact">Emergency Contact</Label>
          <Input
            id="emergency_contact"
            name="emergency_contact"
            type="tel"
            placeholder="+254723456789"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input id="occupation" name="occupation" placeholder="Software Engineer" disabled={loading} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="employer">Employer</Label>
          <Input id="employer" name="employer" placeholder="Tech Company Ltd" disabled={loading} />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Tenant"
          )}
        </Button>
      </div>
    </form>
  )
}
