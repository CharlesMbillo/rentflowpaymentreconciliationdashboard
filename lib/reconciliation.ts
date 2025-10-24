import { prisma } from './db'
import { parseAccountNumber } from './jenga-ipn'
import { broadcastPayment } from './ws'
// Removed invalid import of Prisma type

export interface ReconciliationResult {
  success: boolean
  message: string
  payment?: any
  error?: any
}

export async function reconcilePayment(paymentId: string): Promise<ReconciliationResult> {
  try {
    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return {
        success: false,
        message: 'Payment not found'
      }
    }

    // Skip if already reconciled
    if (payment.reconciled) {
      return {
        success: true,
        message: 'Payment already reconciled',
        payment
      }
    }

    // Parse account number to get lease/tenant info
    const { type, id } = parseAccountNumber(payment.accountNumber)

    if (type === 'unknown' || !id) {
      return {
        success: false,
        message: 'Invalid account number format',
        payment
      }
    }

    // Update payment with lease/tenant connection
    const updateData = {
      reconciled: true,
      reconciledAt: new Date(),
    } as any

    if (type === 'lease') {
      updateData.lease = { connect: { id } }
    } else if (type === 'tenant') {
      updateData.tenant = { connect: { id } }
    }

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
      include: {
        lease: true,
        tenant: true
      }
    })

    // Broadcast update
    await broadcastPayment('payment.reconciled', updatedPayment)

    return {
      success: true,
      message: 'Payment reconciled successfully',
      payment: updatedPayment
    }

  } catch (error) {
    console.error('Error reconciling payment:', error)
    return {
      success: false,
      message: 'Failed to reconcile payment',
      error
    }
  }
}