import { prisma } from "./prisma";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export async function saveIpnLog(rawPayload: string, source = "jenga") {
  return prisma.ipnLog.create({ data: { rawPayload, source, processed: false } });
}
export async function markIpnProcessed(id: number, result: any) {
  return prisma.ipnLog.update({
    where: { id },
    data: { processed: true, processingResult: result, processedAt: new Date() },
  });
}
export async function updatePaymentStatus(payload: {
  orderReference?: string;
  paymentReference?: string;
  transactionReference: string;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  paymentMode?: string;
  remarks?: string;
  paidAt?: Date;
}) {
  const existing = await prisma.payment.findUnique({
    where: { transactionReference: payload.transactionReference },
  });
  if (existing) return { skipped: true };
  const existingOrder = payload.orderReference
    ? await prisma.payment.findFirst({ where: { orderReference: payload.orderReference } })
    : null;
  if (existingOrder) {
    const updated = await prisma.payment.update({
      where: { id: existingOrder.id },
      data: { ...payload, updatedAt: new Date() },
    });
    return { updated: true, id: updated.id };
  }
  const created = await prisma.payment.create({ data: payload });
  return { created: true, id: created.id };
}
