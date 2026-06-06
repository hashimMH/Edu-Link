const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

const migrationsDir = __dirname;
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.match(/^\d{3}_.*\.sql$/))
  .sort();

console.log(`Found ${files.length} migration files:`);
files.forEach(f => console.log(`  - ${f}`));

for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  console.log(`\nRunning ${file}...`);
  try {
    db.exec(sql);
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
