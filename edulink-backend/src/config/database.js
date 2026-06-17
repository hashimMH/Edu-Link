const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://hashim@localhost:5432/edulink',
});

pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  console.error('[DB] Error code:', err.code);
  console.error('[DB] Stack:', err.stack?.substring(0, 200));
});

// Test connection on startup
console.log('[DB] Connecting to:', (process.env.DATABASE_URL || '').replace(/\/\/.*@/, '//***@'));
pool.query('SELECT NOW() as now')
  .then(r => console.log('[DB] PostgreSQL connection verified. Server time:', r.rows[0]?.now))
  .catch(err => {
    console.error('[DB] Connection FAILED:', err.message);
    console.error('[DB] Code:', err.code);
    if (err.stack) console.error('[DB] Stack:', err.stack.substring(0, 300));
  });

module.exports = pool;
