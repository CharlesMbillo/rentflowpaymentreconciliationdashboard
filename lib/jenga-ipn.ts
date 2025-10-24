import crypto from "crypto"

export interface JengaIPNPayload {
  transactionReference: string
  transactionDate: string
  amount: number
  currency: string
  accountNumber: string
  accountName: string
  transactionType: string
  status: "SUCCESS" | "FAILED" | "PENDING"
  narration?: string
  phoneNumber?: string
  merchantCode?: string
}

// Verify HMAC signature from Jenga PGW
export function verifyJengaHMAC(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(payload)
  const calculatedSignature = hmac.digest("hex")
  return calculatedSignature === signature
}

// Generate HMAC signature for testing
export function generateJengaHMAC(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(payload)
  return hmac.digest("hex")
}

// Parse account number to extract lease/tenant information
// Format: LEASE-{leaseId} or TENANT-{tenantId}
export function parseAccountNumber(accountNumber: string): {
  type: "lease" | "tenant" | "unknown"
  id: number | null
} {
  const leaseMatcher = /^LEASE-(\d+)$/i
  const tenantMatcher = /^TENANT-(\d+)$/i

  const leaseMatch = accountNumber.match(leaseMatcher)
  if (leaseMatch) {
    return { type: "lease", id: Number.parseInt(leaseMatch[1]) }
  }

  const tenantMatch = accountNumber.match(tenantMatcher)
  if (tenantMatch) {
    return { type: "tenant", id: Number.parseInt(tenantMatch[1]) }
  }

  return { type: "unknown", id: null }
}
