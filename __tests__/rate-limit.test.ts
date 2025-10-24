import { rateLimiter } from '../lib/rate-limit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// Mock Redis client
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    multi: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  }))
}))

describe('Rate Limiter', () => {
  let mockRedis: jest.Mocked<InstanceType<typeof Redis>>

  beforeEach(() => {
    jest.clearAllMocks()
    mockRedis = new Redis({ url: 'test', token: 'test' }) as jest.Mocked<InstanceType<typeof Redis>>
  })

  it('should allow requests within limit', async () => {
    (mockRedis.multi().exec as jest.Mock).mockResolvedValue([50])

    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '127.0.0.1' }
    })

    const result = await rateLimiter(req as unknown as NextRequest)
    
    expect(result).toBeNull()
    expect(mockRedis.multi().incr).toHaveBeenCalledWith('rate-limit:127.0.0.1')
  })

  it('should block requests over limit', async () => {
    (mockRedis.multi().exec as jest.Mock).mockResolvedValue([150])

    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '127.0.0.1' }
    })

    const result = await rateLimiter(req as unknown as NextRequest)
    
    expect(result?.status).toBe(429)
  })

  it('should handle Redis errors gracefully', async () => {
    (mockRedis.multi().exec as jest.Mock).mockRejectedValue(new Error('Redis error'))

    const req = new Request('http://localhost')
    const result = await rateLimiter(req as unknown as NextRequest)
    
    expect(result).toBeNull() // Should fail open
  })
})