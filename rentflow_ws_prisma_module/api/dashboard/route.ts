import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const total = await prisma.payment.aggregate({
    _sum: { amount: true },
  });

  return NextResponse.json({
    summary: { total: total._sum.amount || 0 },
    recent: payments,
  });
}
