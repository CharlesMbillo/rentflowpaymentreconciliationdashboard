import { z } from "zod";
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  IPN_BASIC_USER: z.string().min(1),
  IPN_BASIC_PASS: z.string().min(1),
  IPN_HMAC_SECRET: z.string().optional(),
  WS_SECRET_KEY: z.string().optional(),
  NODE_ENV: z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid env vars");
}
export const env = parsed.data;
