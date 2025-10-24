import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastMessage } from "@/lib/ws";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const { transaction_id, status, amount, account_number, timestamp } = payload;

    const payment = await prisma.payment.upsert({
      where: { transactionId: transaction_id },
      update: { status, amount, updatedAt: new Date(timestamp) },
      create: {
        transactionId: transaction_id,
        status,
        amount,
        accountNumber: account_number,
        createdAt: new Date(timestamp),
      },
    });

    broadcastMessage({
      type: "payment_update",
      data: payment,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IPN error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
