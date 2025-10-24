import { env } from "../env";
import { NextRequest } from "next/server";
import crypto from "crypto";
export function validateBasicAuth(req: NextRequest): boolean {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const [user, pass] = decoded.split(":");
  return user === env.IPN_BASIC_USER && pass === env.IPN_BASIC_PASS;
}
export function computeHmac(payload: string): string {
  if (!env.IPN_HMAC_SECRET) return "";
  const hmac = crypto.createHmac("sha256", env.IPN_HMAC_SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}
