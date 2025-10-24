import { prisma } from "../lib/db";

async function main() {
  await prisma.payment.createMany({
    data: [
      { transactionId: "TEST001", amount: 1000, status: "COMPLETED", accountNumber: "254712345678" },
      { transactionId: "TEST002", amount: 500, status: "PENDING", accountNumber: "254798765432" },
    ],
  });

  console.log("Seeded initial payments.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
