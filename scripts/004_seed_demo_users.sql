-- Insert demo users with different roles
-- Password for all demo users: "demo123" (hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES 
  ('admin@rentflow.com', '$2a$10$rKZLvVZqJ5xJ5xJ5xJ5xJeO5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ', 'Admin User', 'admin', true),
  ('manager@rentflow.com', '$2a$10$rKZLvVZqJ5xJ5xJ5xJ5xJeO5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ', 'Property Manager', 'manager', true),
  ('accountant@rentflow.com', '$2a$10$rKZLvVZqJ5xJ5xJ5xJ5xJeO5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ', 'Accountant User', 'accountant', true),
  ('viewer@rentflow.com', '$2a$10$rKZLvVZqJ5xJ5xJ5xJ5xJeO5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ', 'Viewer User', 'viewer', true)
ON CONFLICT (email) DO NOTHING;
