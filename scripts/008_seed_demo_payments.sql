-- Insert demo payments for paid and partial statuses
DO $$
DECLARE
  payment_status_record RECORD;
BEGIN
  FOR payment_status_record IN 
    SELECT ps.*, l.tenant_id 
    FROM payment_status ps
    JOIN leases l ON ps.lease_id = l.id
    WHERE ps.paid_amount > 0
  LOOP
    INSERT INTO payments (
      lease_id, 
      tenant_id, 
      amount, 
      payment_date, 
      payment_method, 
      transaction_reference, 
      jenga_transaction_id,
      payment_type, 
      status, 
      month_year
    )
    VALUES (
      payment_status_record.lease_id,
      payment_status_record.tenant_id,
      payment_status_record.paid_amount,
      payment_status_record.due_date + INTERVAL '2 days',
      'jenga_pgw',
      'TXN' || payment_status_record.id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
      'JENGA' || payment_status_record.id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
      'rent',
      'completed',
      payment_status_record.month_year
    );
  END LOOP;
END $$;
