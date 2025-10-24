-- Create demo leases for some rooms
DO $$
DECLARE
  tenant_ids INTEGER[] := ARRAY(SELECT id FROM tenants ORDER BY id LIMIT 8);
  room_ids INTEGER[] := ARRAY(SELECT id FROM rooms WHERE status = 'vacant' ORDER BY id LIMIT 8);
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    IF tenant_ids[i] IS NOT NULL AND room_ids[i] IS NOT NULL THEN
      -- Update room status
      UPDATE rooms SET status = 'occupied' WHERE id = room_ids[i];
      
      -- Create lease
      INSERT INTO leases (tenant_id, room_id, start_date, end_date, monthly_rent, deposit_paid, status, payment_day)
      SELECT 
        tenant_ids[i],
        room_ids[i],
        CURRENT_DATE - INTERVAL '3 months',
        CURRENT_DATE + INTERVAL '9 months',
        rent_amount,
        deposit_amount,
        'active',
        5
      FROM rooms WHERE id = room_ids[i];
    END IF;
  END LOOP;
END $$;
