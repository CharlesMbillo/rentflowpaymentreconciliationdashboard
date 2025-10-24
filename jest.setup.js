// Mock environment variables
process.env.JENGA_HMAC_SECRET = 'test-secret'
process.env.JENGA_MERCHANT_CODE = 'test-merchant'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

// Global test setup
jest.setTimeout(10000) // 10 second timeout