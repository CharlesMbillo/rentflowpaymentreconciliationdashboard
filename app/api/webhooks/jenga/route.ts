import { NextRequest } from "next/server"
import { verifyJengaHMAC } from "@/lib/jenga-ipn"
import { env } from "@/lib/env"
import { webhookMonitor, logPaymentError } from "@/lib/monitoring"
import { webhookRateLimiter } from "@/lib/rate-limit"
import { prisma } from "@/lib/db"
import { broadcastPayment } from "@/lib/ws"
import { reconcilePayment } from "@/lib/reconciliation"

export async function POST(req: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await webhookRateLimiter(req)
    if (rateLimit) return rateLimit

    // Get raw body for HMAC verification
    const payload = await req.text()
    const signature = req.headers.get("x-jenga-signature")

    if (!signature) {
      webhookMonitor.recordFailure(new Error("Missing signature"))
      return new Response("Missing signature", { status: 401 })
    }

    // Verify HMAC signature
    const isValid = verifyJengaHMAC(payload, signature, env.JENGA_HMAC_SECRET)
    if (!isValid) {
      webhookMonitor.recordFailure(new Error("Invalid signature"))
      return new Response("Invalid signature", { status: 401 })
    }

    // Parse JSON payload
    const data = JSON.parse(payload)
    const { 
      customer,
      transaction,
      bank,
      callbackType 
    } = data

    // Handle different callback types
    if (callbackType !== "IPN") {
      webhookMonitor.recordFailure(new Error("Invalid callback type"))
      return new Response("Invalid callback type", { status: 400 })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        transactionReference: transaction.reference,
        transactionDate: new Date(transaction.date),
        amount: transaction.amount,
        currency: transaction.currency,
        accountNumber: transaction.billNumber,
        status: transaction.status,
        paymentMode: transaction.paymentMode,
        narration: transaction.remarks,
        phoneNumber: customer.mobileNumber,
        merchantCode: env.JENGA_MERCHANT_CODE,
        serviceCharge: transaction.serviceCharge,
        orderAmount: transaction.orderAmount,
        orderCurrency: transaction.orderCurrency,
        additionalInfo: transaction.additionalInfo
      }
    })

    // Broadcast payment created event
    await broadcastPayment('payment.created', payment)

    // Attempt immediate reconciliation
    const reconciliation = await reconcilePayment(payment.id)
    
    webhookMonitor.recordSuccess()
    
    return new Response("OK", { 
      status: 200,
      headers: {
        'X-Reconciliation-Status': reconciliation.success ? 'success' : 'pending'
      }
    })

  } catch (error) {
    const err = error as Error
    logPaymentError(err, 'unknown', 'process-webhook')
    webhookMonitor.recordFailure(err)
    return new Response("Internal server error", { status: 500 })
  }
}