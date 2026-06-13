-- The 'role' column in the users table is plain TEXT (not an enum).
-- If there is a CHECK constraint limiting allowed roles, update it here.
-- Otherwise, no migration is needed — just insert rows with role = 'mentor'.

-- Check if a constraint exists and drop + recreate it:
DO $$
BEGIN
  -- Drop existing check constraint if it exists (name may vary)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users'
      AND constraint_type = 'CHECK'
      AND constraint_name ILIKE '%role%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE users DROP CONSTRAINT ' || quote_ident(constraint_name)
      FROM information_schema.table_constraints
      WHERE table_name = 'users'
        AND constraint_type = 'CHECK'
        AND constraint_name ILIKE '%role%'
      LIMIT 1
    );
  END IF;
END $$;

-- Add updated check constraint that includes 'mentor'
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('student', 'teacher', 'mentor', 'admin', 'support', 'super_admin'));
