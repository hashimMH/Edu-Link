const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://hashim@localhost:5432/edulink',
});

pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

// Test connection on startup
pool.query('SELECT 1')
  .then(() => console.log('[DB] PostgreSQL connection verified'))
  .catch(err => console.error('[DB] Connection failed:', err.message));

module.exports = pool;
