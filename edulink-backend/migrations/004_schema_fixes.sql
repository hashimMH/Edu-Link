-- Schema fixes: ensure the 'admin' role is included in the CHECK constraint,
-- and that password_hash is nullable (for Firebase auth users).
-- PostgreSQL allows altering CHECK constraints more easily than SQLite.

-- Drop the old CHECK constraint (name may vary, so we use a DO block)
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
EXCEPTION WHEN undefined_object THEN
  -- constraint doesn't exist, that's OK
END;
$$;

-- Add the correct CHECK constraint
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('student', 'teacher', 'admin'));

-- Ensure password_hash is nullable (it already is from 001, but confirm)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
