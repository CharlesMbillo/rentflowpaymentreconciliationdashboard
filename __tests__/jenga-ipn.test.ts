import { verifyJengaHMAC, parseAccountNumber } from '../lib/jenga-ipn'
import crypto from 'crypto'
import { describe, it, expect } from '@jest/globals'

describe('Jenga IPN Handler', () => {
  const testSecret = 'test-secret'
  const testPayload = JSON.stringify({
    callbackType: 'IPN',
    transaction: { reference: '123' }
  })

  describe('verifyJengaHMAC', () => {
    it('should verify valid HMAC signatures', () => {
      const hmac = crypto.createHmac('sha256', testSecret).update(testPayload).digest('hex')
      
      expect(verifyJengaHMAC(testPayload, hmac, testSecret)).toBe(true)
    })

    it('should reject invalid HMAC signatures', () => {
      const invalidHmac = 'invalid-signature'
      expect(verifyJengaHMAC(testPayload, invalidHmac, testSecret)).toBe(false)
    })
  })

  describe('parseAccountNumber', () => {
    it('should parse lease account numbers', () => {
      expect(parseAccountNumber('LEASE-123')).toEqual({
        type: 'lease',
        id: 123
      })
    })

    it('should parse tenant account numbers', () => {
      expect(parseAccountNumber('TENANT-456')).toEqual({
        type: 'tenant',
        id: 456
      })
    })

    it('should handle unknown formats', () => {
      expect(parseAccountNumber('INVALID-123')).toEqual({
        type: 'unknown',
        id: null
      })
    })
  })
})