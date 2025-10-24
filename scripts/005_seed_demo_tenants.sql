-- Insert demo tenants
INSERT INTO tenants (id_number, full_name, email, phone, emergency_contact, occupation, employer, kyc_verified)
VALUES 
  ('12345678', 'John Kamau', 'john.kamau@email.com', '+254712345678', '+254723456789', 'Software Engineer', 'Tech Corp Ltd', true),
  ('23456789', 'Mary Wanjiku', 'mary.wanjiku@email.com', '+254723456789', '+254734567890', 'Teacher', 'Nairobi School', true),
  ('34567890', 'Peter Omondi', 'peter.omondi@email.com', '+254734567890', '+254745678901', 'Accountant', 'Finance Plus', true),
  ('45678901', 'Grace Akinyi', 'grace.akinyi@email.com', '+254745678901', '+254756789012', 'Nurse', 'City Hospital', true),
  ('56789012', 'David Mwangi', 'david.mwangi@email.com', '+254756789012', '+254767890123', 'Business Owner', 'Self Employed', true),
  ('67890123', 'Sarah Njeri', 'sarah.njeri@email.com', '+254767890123', '+254778901234', 'Marketing Manager', 'Brand Agency', true),
  ('78901234', 'James Otieno', 'james.otieno@email.com', '+254778901234', '+254789012345', 'Driver', 'Logistics Co', true),
  ('89012345', 'Lucy Wambui', 'lucy.wambui@email.com', '+254789012345', '+254790123456', 'Chef', 'Restaurant Ltd', true)
ON CONFLICT (id_number) DO NOTHING;
