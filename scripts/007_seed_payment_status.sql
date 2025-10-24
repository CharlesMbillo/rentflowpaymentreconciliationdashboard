-- Generate payment status for active leases for the last 3 months and current month
DO $$
DECLARE
  lease_record RECORD;
  month_offset INTEGER;
  current_month VARCHAR(7);
  due_date DATE;
BEGIN
  FOR lease_record IN SELECT id, room_id, monthly_rent, payment_day FROM leases WHERE status = 'active' LOOP
    FOR month_offset IN 0..3 LOOP
      current_month := TO_CHAR(CURRENT_DATE - (month_offset || ' months')::INTERVAL, 'YYYY-MM');
      due_date := (DATE_TRUNC('month', CURRENT_DATE - (month_offset || ' months')::INTERVAL) + (lease_record.payment_day - 1 || ' days')::INTERVAL)::DATE;
      
      INSERT INTO payment_status (lease_id, room_id, month_year, expected_amount, paid_amount, status, due_date)
      VALUES (
        lease_record.id,
        lease_record.room_id,
        current_month,
        lease_record.monthly_rent,
        CASE 
          WHEN month_offset = 0 THEN 0 -- Current month: unpaid
          WHEN month_offset = 1 THEN lease_record.monthly_rent * 0.5 -- Last month: partial
          ELSE lease_record.monthly_rent -- Older months: paid
        END,
        CASE 
          WHEN month_offset = 0 AND CURRENT_DATE > due_date THEN 'overdue'
          WHEN month_offset = 0 THEN 'pending'
          WHEN month_offset = 1 THEN 'partial'
          ELSE 'paid'
        END,
        due_date
      )
      ON CONFLICT (lease_id, month_year) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
