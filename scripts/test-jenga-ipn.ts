// Test script to simulate Jenga PGW IPN webhook
import { generateJengaHMAC } from "../lib/jenga-ipn"

const testPayload = {
  transactionReference: "TXN" + Date.now(),
  transactionDate: new Date().toISOString(),
  amount: 7500.0,
  currency: "KES",
  accountNumber: "LEASE-1", // Change to match your lease ID
  accountName: "John Kamau",
  transactionType: "PAYMENT",
  status: "SUCCESS",
  narration: "Rent payment for January 2025",
  phoneNumber: "+254712345678",
  merchantCode: "RENTFLOW001",
}

const payloadString = JSON.stringify(testPayload)
const secret = process.env.JENGA_HMAC_SECRET || "your-jenga-secret-key"
const signature = generateJengaHMAC(payloadString, secret)

console.log("Test Jenga IPN Payload:")
console.log("=======================")
console.log("Payload:", payloadString)
console.log("\nHMAC Signature:", signature)
console.log("\nTo test the webhook, send a POST request to:")
console.log("URL: http://localhost:3000/api/webhooks/jenga-ipn")
console.log("Headers:")
console.log("  Content-Type: application/json")
console.log("  x-jenga-signature:", signature)
console.log("\nBody:", payloadString)
console.log("\nOr use this curl command:")
console.log(`
curl -X POST http://localhost:3000/api/webhooks/jenga-ipn \\
  -H "Content-Type: application/json" \\
  -H "x-jenga-signature: ${signature}" \\
  -d '${payloadString}'
`)
