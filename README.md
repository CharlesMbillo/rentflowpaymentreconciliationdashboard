# RentFlow - Payment Reconciliation Dashboard

A full-stack Next.js application for managing multi-property rent collection with real-time Jenga PGW IPN integration.

## Features

- **Real-time Room Matrix Dashboard**: Color-coded visualization of payment status across 1,929 rooms in 8 blocks
  - Green: Paid
  - Amber: Partial payment
  - Red: Overdue
  - Blue: Pending
  - Grey: Vacant

- **Tenant Management**: Complete tenant onboarding with KYC verification and lease management

- **Payment Reconciliation**: Automatic payment processing via Jenga PGW IPN webhooks with HMAC verification

- **Analytics Dashboard**: Revenue trends, occupancy rates, payment status tracking, and overdue alerts

- **Audit Trail**: Complete activity logging for compliance and security

- **Offline Mode**: Local data caching and sync when connection is restored

- **Real-time Updates**: Automatic dashboard refresh every 30 seconds

- **Role-Based Access Control**: Admin, Manager, Accountant, and Viewer roles

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT-based sessions
- **Charts**: Recharts
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`
   DATABASE_URL=your_neon_database_url
   JWT_SECRET=your_jwt_secret
   JENGA_HMAC_SECRET=your_jenga_hmac_secret
   \`\`\`

4. Run database migrations:
   - Execute all SQL scripts in the `scripts/` folder in order (001-008)

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts

- **Admin**: admin@rentflow.com / demo123
- **Manager**: manager@rentflow.com / demo123
- **Accountant**: accountant@rentflow.com / demo123
- **Viewer**: viewer@rentflow.com / demo123

## Jenga PGW Integration

### Webhook Setup

1. Configure your Jenga PGW webhook URL:
   \`\`\`
   https://your-domain.com/api/webhooks/jenga-ipn
   \`\`\`

2. Set the HMAC secret in your environment variables

3. Use account number format: `LEASE-{lease_id}` or `TENANT-{tenant_id}`

### Testing IPN

Use the test script to simulate payment notifications:

\`\`\`bash
npm run test-ipn
\`\`\`

Or use the provided curl command from the script output.

## Property Structure

- **Block A**: 224 rooms (28/floor, 8 floors)
- **Block B**: 231 rooms (28/floor for 7 floors, 7 on 8th)
- **Block C**: 224 rooms (28/floor, 8 floors)
- **Block D**: 358 rooms (42/floor for 8 floors, 8 on 9th)
- **Block E**: 350 rooms (42/floor for 8 floors, 14 on 9th)
- **Block F**: 234 rooms (28/floor for 8 floors, 10 on 9th)
- **Block G**: 234 rooms (28/floor for 8 floors, 10 on 9th)
- **Block H**: 74 rooms (9/floor for 8 floors, 2 on 9th)

**Total**: 1,929 rooms across 8 blocks

## Deployment

Deploy to Vercel:

\`\`\`bash
vercel deploy
\`\`\`

Ensure all environment variables are configured in your Vercel project settings.

## License

MIT


1️⃣ Architecture Overview

Here’s how it works:
+----------------------------+
| Equity Jenga IPN Webhook   |
| (POST /api/ipn)            |
+-------------+--------------+
              |
              v
     [Next.js Server / API Route]
        /api/ipn/route.ts
              |
              v
         Prisma ORM
              |
              v
        PostgreSQL (Neon)
              |
              v
    WebSocket Broadcast → Connected dashboards
              |
              v
   /api/ws  <---->  dashboard.tsx (frontend)


2️⃣ Folder Structure
rentflowpaymentreconciliationdashboard/
├── lib/
│   ├── db.ts
│   └── ws.ts
├── prisma/
│   └── schema.prisma
├── api/
│   ├── ipn/
│   │   └── route.ts
│   ├── dashboard/
│   │   └── route.ts
│   └── ws/
│       └── route.ts
├── scripts/
│   └── seed.ts
├── .env.example
