import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { env } from './env'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface RateLimitConfig {
  limit: number      // Maximum requests
  window: number     // Time window in seconds
}

const defaultConfig: RateLimitConfig = {
  limit: 100,        // 100 requests
  window: 60         // per minute
}

export async function rateLimiter(
  req: NextRequest,
  config: RateLimitConfig = defaultConfig
) {
  try {
    // Try to get the IP address from the x-forwarded-for header or fallback to 127.0.0.1
        const ip =
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          req.headers.get('x-real-ip') ||
          '127.0.0.1'
    const key = `rate-limit:${ip}`

    const [response] = await redis
      .multi()
      .incr(key)
      .expire(key, config.window)
      .exec()

    const currentCount = response as number

    // Add rate limit headers
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', config.limit.toString())
    headers.set('X-RateLimit-Remaining', Math.max(0, config.limit - currentCount).toString())
    
    // Check if rate limit exceeded
    if (currentCount > config.limit) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers
        }
      )
    }

    return null // No rate limit exceeded

  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow request if rate limiting fails
    return null
  }
}

// Webhook specific rate limiter
export async function webhookRateLimiter(req: NextRequest) {
  const webhookConfig: RateLimitConfig = {
    limit: 1000,    // 1000 webhooks
    window: 3600    // per hour
  }
  
  return rateLimiter(req, webhookConfig)
}