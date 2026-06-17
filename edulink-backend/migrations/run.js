const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

const migrationsDir = __dirname;
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.match(/^\d{3}_.*\.sql$/))
  .sort();

console.log(`Found ${files.length} migration files:`);
files.forEach(f => console.log(`  - ${f}`));

(async function run() {
  const client = await pool.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`\nRunning ${file}...`);
      try {
        await client.query(sql);
        console.log(`  ✓ Completed`);
      } catch (err) {
        // If table/column already exists, that's OK — continue
        if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
          console.log(`  ⚠ Skipped (already applied): ${err.message.split('\n')[0]}`);
        } else {
          console.error(`  ✗ FAILED: ${err.message}`);
          throw err;
        }
      }
    }
    console.log('\nAll migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    // Don't call pool.end() — the server needs the pool after migrations
  }
})();
