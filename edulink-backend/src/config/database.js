const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER || 'hashim',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'edulink',
    });

pool.on('connect', () => console.log('[DB] Connected'));
pool.on('error', err => console.error('[DB] Error:', err.message));

pool.query('SELECT NOW() as now')
  .then(r => console.log('[DB] Verified. Time:', r.rows[0]?.now))
  .catch(err => console.error('[DB] FAILED:', err.message, '(code:', err.code, ')'));

module.exports = pool;
