-- Seed default admin account for local testing.
-- Login: admin@admin.com
-- Password: 123456
--
-- Change this password before any production deployment.

INSERT INTO users (
  email,
  mobile,
  full_name,
  password_hash,
  role,
  is_active,
  email_verified_at,
  created_at,
  updated_at
)
VALUES (
  'admin@admin.com',
  '01999999999',
  'Default Admin',
  '$2b$10$mEN98KAVpcpSxBDa6PTGzeydhqPQSXM6UvbIvIXcCdlY7UV/AeRS.',
  'admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  is_active = true,
  email_verified_at = COALESCE(users.email_verified_at, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP;
