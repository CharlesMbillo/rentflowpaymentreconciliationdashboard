import { z } from "zod"

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),

  // JWT auth
  JWT_SECRET: z.string().min(32),

  // Jenga PGW
  JENGA_API_KEY: z.string(),
  JENGA_SECRET: z.string(),
  JENGA_MERCHANT_CODE: z.string(),
  JENGA_HMAC_SECRET: z.string(),

  // WebSocket
  NEXT_PUBLIC_WS_URL: z.string().url(),

  // Resource limits
  MAX_ALLOC_BYTES: z.coerce.number().positive(),
})

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
  JWT_SECRET: process.env.JWT_SECRET,
  JENGA_API_KEY: process.env.JENGA_API_KEY,
  JENGA_SECRET: process.env.JENGA_SECRET,
  JENGA_MERCHANT_CODE: process.env.JENGA_MERCHANT_CODE,
  JENGA_HMAC_SECRET: process.env.JENGA_HMAC_SECRET,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  MAX_ALLOC_BYTES: process.env.MAX_ALLOC_BYTES || "256000000",
})