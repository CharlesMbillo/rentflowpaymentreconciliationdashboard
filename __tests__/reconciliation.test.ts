import { reconcilePayment } from '../lib/reconciliation'
import { prisma } from '../lib/db'
import { broadcastPayment } from '../lib/ws'

// Mock dependencies
jest.mock('../lib/db', () => ({
  prisma: {
    payment: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}))

jest.mock('../lib/ws', () => ({
  broadcastPayment: jest.fn()
}))

describe('Payment Reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reconcile valid lease payments', async () => {
    const mockPayment = {
      id: 'payment-1',
      accountNumber: 'LEASE-123',
      reconciled: false
    }

    // Mock database calls
    prisma.payment.findUnique.mockResolvedValue(mockPayment)
    prisma.payment.update.mockResolvedValue({
      ...mockPayment,
      reconciled: true,
      leaseId: 123
    })

    const result = await reconcilePayment('payment-1')

    expect(result.success).toBe(true)
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({
        reconciled: true,
        lease: { connect: { id: 123 } }
      }),
      include: { lease: true, tenant: true }
    })
    expect(broadcastPayment).toHaveBeenCalledWith('payment.reconciled', expect.any(Object))
  })

  it('should handle already reconciled payments', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      reconciled: true
    })

    const result = await reconcilePayment('payment-1')

    expect(result.success).toBe(true)
    expect(result.message).toBe('Payment already reconciled')
    expect(prisma.payment.update).not.toHaveBeenCalled()
  })

  it('should handle invalid account numbers', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      accountNumber: 'INVALID-123',
      reconciled: false
    })

    const result = await reconcilePayment('payment-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Invalid account number format')
  })
})