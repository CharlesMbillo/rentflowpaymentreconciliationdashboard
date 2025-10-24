import { z } from 'zod'

// Validation schemas for Jenga IPN payload
const CustomerSchema = z.object({
  name: z.string(),
  mobileNumber: z.string().regex(/^254\d{9}$/),
  reference: z.string()
})

const TransactionSchema = z.object({
  date: z.string().datetime(),
  reference: z.string(),
  paymentMode: z.enum(['CARD', 'MPESA', 'PWE', 'EQUITEL', 'PAYPAL']),
  amount: z.number().positive(),
  currency: z.string().length(3),
  billNumber: z.string(),
  servedBy: z.string(),
  additionalInfo: z.string().optional(),
  orderAmount: z.number().positive(),
  serviceCharge: z.number().min(0),
  orderCurrency: z.string().length(3),
  status: z.enum(['SUCCESS', 'FAILED']),
  remarks: z.string()
})

const BankSchema = z.object({
  reference: z.string(),
  transactionType: z.string().length(1),
  account: z.string().nullable()
})

export const JengaIPNSchema = z.object({
  callbackType: z.literal('IPN'),
  customer: CustomerSchema,
  transaction: TransactionSchema,
  bank: BankSchema
})

export type JengaIPNPayload = z.infer<typeof JengaIPNSchema>

// Additional validation functions
export function validateAmount(amount: number, orderAmount: number): boolean {
  // Allow small discrepancy (e.g., due to rounding)
  const tolerance = 0.01
  return Math.abs(amount - orderAmount) <= tolerance
}

export function validateTransactionReference(reference: string): boolean {
  // Check format: numeric string of length 12
  return /^\d{12}$/.test(reference)
}

export function validateMobileNumber(number: string): boolean {
  // Kenya mobile number format: 254XXXXXXXXX
  return /^254\d{9}$/.test(number)
}

export function validateBillNumber(billNumber: string): boolean {
  // Format: LEASE-XXX or TENANT-XXX
  return /^(LEASE|TENANT)-\d+$/i.test(billNumber)
}

// Comprehensive validation function
export function validateIPNPayload(payload: unknown): {
  valid: boolean
  data?: JengaIPNPayload
  errors?: z.ZodError
} {
  try {
    const data = JengaIPNSchema.parse(payload)
    
    // Additional business logic validations
    const validations = [
      validateAmount(data.transaction.amount, data.transaction.orderAmount),
      validateTransactionReference(data.transaction.reference),
      validateMobileNumber(data.customer.mobileNumber),
      validateBillNumber(data.transaction.billNumber)
    ]

    if (!validations.every(v => v)) {
      return {
        valid: false,
        errors: new z.ZodError([{
          code: 'custom',
          path: ['business_logic'],
          message: 'Failed business logic validation'
        }])
      }
    }

    return {
      valid: true,
      data
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error
      }
    }
    throw error
  }
}