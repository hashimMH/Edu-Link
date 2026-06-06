-- Schema fixes: add 'admin' role, make password_hash nullable for Firebase auth users
-- SQLite can't alter CHECK constraints, so we recreate the table safely
-- by temporarily disabling foreign key enforcement and re-enabling after.

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- Step 1: Create replacement table with correct constraints
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
  avatar_url TEXT,
  country TEXT,
  interests TEXT,
  google_id TEXT UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 2: Copy all data
INSERT INTO users_new SELECT * FROM users;

-- Step 3: Swap tables
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

COMMIT;

PRAGMA foreign_keys = ON;
