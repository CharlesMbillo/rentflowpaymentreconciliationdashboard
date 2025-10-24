import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function setupDatabase() {
  console.log("[v0] Starting database setup...")

  try {
    // 1. Create Schema
    console.log("[v0] Creating schema...")

    await sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        total_blocks INTEGER DEFAULT 0,
        total_rooms INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        total_floors INTEGER NOT NULL,
        rooms_per_floor INTEGER NOT NULL,
        total_rooms INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
        room_number VARCHAR(10) NOT NULL,
        floor_number INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'vacant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(block_id, room_number)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50) NOT NULL,
        id_number VARCHAR(50) UNIQUE NOT NULL,
        emergency_contact VARCHAR(255),
        emergency_phone VARCHAR(50),
        kyc_status VARCHAR(50) DEFAULT 'pending',
        kyc_verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS leases (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        monthly_rent DECIMAL(10, 2) NOT NULL,
        deposit_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        lease_id INTEGER REFERENCES leases(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date TIMESTAMP NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        transaction_reference VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'completed',
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS payment_status (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        lease_id INTEGER REFERENCES leases(id) ON DELETE CASCADE,
        billing_month DATE NOT NULL,
        amount_due DECIMAL(10, 2) NOT NULL,
        amount_paid DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE NOT NULL,
        last_payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, billing_month)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS ipn_logs (
        id SERIAL PRIMARY KEY,
        transaction_reference VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        signature VARCHAR(500),
        status VARCHAR(50) DEFAULT 'received',
        processed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id SERIAL PRIMARY KEY,
        action_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_rooms_block ON rooms(block_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_leases_room ON leases(room_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_lease ON payments(lease_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_status_room ON payment_status(room_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_status_month ON payment_status(billing_month)`
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_status_status ON payment_status(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)`

    console.log("[v0] ✓ Schema created successfully")

    // 2. Seed Properties and Blocks
    console.log("[v0] Seeding properties and blocks...")

    const property = await sql`
      INSERT INTO properties (name, address, total_blocks, total_rooms)
      VALUES ('RentFlow Property', 'Nairobi, Kenya', 8, 1929)
      RETURNING id
    `
    const propertyId = property[0].id

    await sql`
      INSERT INTO blocks (property_id, name, total_floors, rooms_per_floor, total_rooms)
      VALUES 
        (${propertyId}, 'Block A', 8, 28, 224),
        (${propertyId}, 'Block B', 8, 28, 231),
        (${propertyId}, 'Block C', 8, 28, 224),
        (${propertyId}, 'Block D', 8, 42, 358),
        (${propertyId}, 'Block E', 8, 42, 350),
        (${propertyId}, 'Block F', 8, 28, 234),
        (${propertyId}, 'Block G', 8, 28, 234),
        (${propertyId}, 'Block H', 8, 9, 74)
    `

    console.log("[v0] ✓ Properties and blocks seeded")

    // 3. Seed Rooms
    console.log("[v0] Seeding rooms (this may take a moment)...")

    const blocks = await sql`SELECT id, name, total_floors, rooms_per_floor FROM blocks ORDER BY name`

    for (const block of blocks) {
      const rooms = []
      let roomNum = 1

      for (let floor = 1; floor <= block.total_floors; floor++) {
        let roomsOnFloor = block.rooms_per_floor

        // Handle last floor exceptions
        if (floor === 8) {
          if (block.name === "Block B") roomsOnFloor = 7
          else if (block.name === "Block D") roomsOnFloor = 8
          else if (block.name === "Block E") roomsOnFloor = 9
          else if (block.name === "Block F") roomsOnFloor = 10
          else if (block.name === "Block G") roomsOnFloor = 8
          else if (block.name === "Block H") roomsOnFloor = 2
        }

        for (let i = 0; i < roomsOnFloor; i++) {
          rooms.push({ blockId: block.id, roomNumber: roomNum.toString(), floor })
          roomNum++
        }
      }

      // Insert rooms in batches
      for (let i = 0; i < rooms.length; i += 50) {
        const batch = rooms.slice(i, i + 50)
        for (const room of batch) {
          await sql`
            INSERT INTO rooms (block_id, room_number, floor_number, status)
            VALUES (${room.blockId}, ${room.roomNumber}, ${room.floor}, 'vacant')
          `
        }
      }
    }

    console.log("[v0] ✓ Rooms seeded")

    // 4. Seed Demo Users
    console.log("[v0] Seeding demo users...")

    await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES 
        ('admin@rentflow.com', '$2a$10$rZ8qNqZ7YxEZxKj0vZ8qNe7YxEZxKj0vZ8qNe7YxEZxKj0vZ8qNe', 'Admin User', 'admin'),
        ('manager@rentflow.com', '$2a$10$rZ8qNqZ7YxEZxKj0vZ8qNe7YxEZxKj0vZ8qNe7YxEZxKj0vZ8qNe', 'Property Manager', 'manager'),
        ('accountant@rentflow.com', '$2a$10$rZ8qNqZ7YxEZxKj0vZ8qNe7YxEZxKj0vZ8qNe7YxEZxKj0vZ8qNe', 'Accountant User', 'accountant'),
        ('viewer@rentflow.com', '$2a$10$rZ8qNqZ7YxEZxKj0vZ8qNe7YxEZxKj0vZ8qNe7YxEZxKj0vZ8qNe', 'Viewer User', 'viewer')
    `

    console.log("[v0] ✓ Demo users seeded")

    // 5. Seed Demo Tenants
    console.log("[v0] Seeding demo tenants...")

    await sql`
      INSERT INTO tenants (full_name, email, phone, id_number, emergency_contact, emergency_phone, kyc_status, kyc_verified_at)
      VALUES 
        ('John Kamau', 'john.kamau@email.com', '+254712345678', '12345678', 'Jane Kamau', '+254723456789', 'verified', CURRENT_TIMESTAMP),
        ('Mary Wanjiku', 'mary.wanjiku@email.com', '+254723456789', '23456789', 'Peter Wanjiku', '+254734567890', 'verified', CURRENT_TIMESTAMP),
        ('David Omondi', 'david.omondi@email.com', '+254734567890', '34567890', 'Sarah Omondi', '+254745678901', 'verified', CURRENT_TIMESTAMP),
        ('Grace Akinyi', 'grace.akinyi@email.com', '+254745678901', '45678901', 'James Akinyi', '+254756789012', 'verified', CURRENT_TIMESTAMP),
        ('Peter Mwangi', 'peter.mwangi@email.com', '+254756789012', '56789012', 'Lucy Mwangi', '+254767890123', 'verified', CURRENT_TIMESTAMP)
    `

    console.log("[v0] ✓ Demo tenants seeded")

    // 6. Seed Demo Leases
    console.log("[v0] Seeding demo leases...")

    const sampleRooms = await sql`SELECT id FROM rooms ORDER BY id LIMIT 5`
    const tenants = await sql`SELECT id FROM tenants ORDER BY id`

    for (let i = 0; i < Math.min(sampleRooms.length, tenants.length); i++) {
      await sql`
        INSERT INTO leases (tenant_id, room_id, start_date, end_date, monthly_rent, deposit_amount, status)
        VALUES (
          ${tenants[i].id},
          ${sampleRooms[i].id},
          CURRENT_DATE - INTERVAL '3 months',
          CURRENT_DATE + INTERVAL '9 months',
          15000.00,
          30000.00,
          'active'
        )
      `

      await sql`
        UPDATE rooms 
        SET status = 'occupied' 
        WHERE id = ${sampleRooms[i].id}
      `
    }

    console.log("[v0] ✓ Demo leases seeded")

    // 7. Seed Payment Status
    console.log("[v0] Seeding payment status...")

    const activeLeases = await sql`SELECT id, room_id, monthly_rent FROM leases WHERE status = 'active'`

    for (const lease of activeLeases) {
      // Create payment status for last 3 months
      for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
        const billingMonth = new Date()
        billingMonth.setMonth(billingMonth.getMonth() - monthsAgo)
        billingMonth.setDate(1)

        const dueDate = new Date(billingMonth)
        dueDate.setDate(5)

        let status = "pending"
        let amountPaid = 0

        if (monthsAgo === 2) {
          status = "paid"
          amountPaid = lease.monthly_rent
        } else if (monthsAgo === 1) {
          status = Math.random() > 0.3 ? "paid" : "overdue"
          amountPaid = status === "paid" ? lease.monthly_rent : 0
        }

        await sql`
          INSERT INTO payment_status (room_id, lease_id, billing_month, amount_due, amount_paid, status, due_date)
          VALUES (
            ${lease.room_id},
            ${lease.id},
            ${billingMonth.toISOString().split("T")[0]},
            ${lease.monthly_rent},
            ${amountPaid},
            ${status},
            ${dueDate.toISOString().split("T")[0]}
          )
        `
      }
    }

    console.log("[v0] ✓ Payment status seeded")

    // 8. Seed Demo Payments
    console.log("[v0] Seeding demo payments...")

    const paidStatuses = await sql`
      SELECT ps.*, l.id as lease_id 
      FROM payment_status ps
      JOIN leases l ON ps.lease_id = l.id
      WHERE ps.status = 'paid'
    `

    for (const status of paidStatuses) {
      await sql`
        INSERT INTO payments (lease_id, amount, payment_date, payment_method, transaction_reference, status, created_by)
        VALUES (
          ${status.lease_id},
          ${status.amount_paid},
          ${status.billing_month},
          'mpesa',
          ${`TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`},
          'completed',
          1
        )
      `
    }

    console.log("[v0] ✓ Demo payments seeded")

    // Verify setup
    console.log("[v0] Verifying database setup...")

    const roomCount = await sql`SELECT COUNT(*) as count FROM rooms`
    const tenantCount = await sql`SELECT COUNT(*) as count FROM tenants`
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const leaseCount = await sql`SELECT COUNT(*) as count FROM leases`
    const paymentCount = await sql`SELECT COUNT(*) as count FROM payments`

    console.log("[v0] Database setup completed successfully!")
    console.log("[v0] Summary:")
    console.log(`  - Rooms: ${roomCount[0].count}`)
    console.log(`  - Tenants: ${tenantCount[0].count}`)
    console.log(`  - Users: ${userCount[0].count}`)
    console.log(`  - Active Leases: ${leaseCount[0].count}`)
    console.log(`  - Payments: ${paymentCount[0].count}`)
  } catch (error) {
    console.error("[v0] Database setup failed:", error)
    throw error
  }
}

setupDatabase()
