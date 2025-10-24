import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateBasicAuth, computeHmac } from "@/lib/middleware/basicAuth";
import { saveIpnLog, markIpnProcessed, updatePaymentStatus } from "@/lib/reconciliation";
import { env } from "@/lib/env";
import { broadcastPaymentUpdate } from "@/app/api/ws/route";
const ipnSchema = z.object({
  transaction: z.object({
    reference: z.string(),
    orderReference: z.string().optional(),
    amount: z.number().or(z.string().transform(Number)),
    currency: z.string().optional(),
    status: z.string().optional(),
    paymentMode: z.string().optional(),
    remarks: z.string().optional(),
    date: z.string().optional(),
  }),
});
export async function POST(req: NextRequest) {
  if (!validateBasicAuth(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const raw = await req.text();
  if (env.IPN_HMAC_SECRET) {
    const signature = req.headers.get("x-jenga-signature");
    if (signature && signature !== computeHmac(raw)) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
  }
  const log = await saveIpnLog(raw, "jenga");
  const json = JSON.parse(raw);
  const parsed = ipnSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Schema error" }, { status: 400 });
  }
  const tx = parsed.data.transaction;
  const result = await updatePaymentStatus({
    transactionReference: tx.reference,
    orderReference: tx.orderReference,
    amount: tx.amount,
    currency: tx.currency,
    status: (tx.status ?? "SUCCESS").toUpperCase() as any,
    paymentMode: tx.paymentMode,
    remarks: tx.remarks,
    paidAt: tx.date ? new Date(tx.date) : new Date(),
  });
  await markIpnProcessed(log.id, result);
  broadcastPaymentUpdate({
    transactionReference: tx.reference,
    status: tx.status ?? "SUCCESS",
    amount: tx.amount,
  });
  return NextResponse.json({ message: "ok" });
}
