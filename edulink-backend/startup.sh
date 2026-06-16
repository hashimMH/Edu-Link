#!/bin/bash
set -e

echo "[Startup] Running migrations..."
node migrations/run.js

# Check if seed data already exists
EXISTS=$(node -e "
const db = require('./src/config/database');
const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
console.log(count);
")

if [ "$EXISTS" -eq "0" ]; then
  echo "[Startup] No users found — running seed..."
  node seeds/seed.js
else
  echo "[Startup] Database already has $EXISTS users — skipping seed"
fi

echo "[Startup] Starting server..."
node src/index.js
