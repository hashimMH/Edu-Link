const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const env = require('./env');

// Always resolve DB_PATH relative to the project root (where package.json lives),
// not wherever the user happens to run `node` from.
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const dbFullPath = path.isAbsolute(env.DB_PATH)
  ? env.DB_PATH
  : path.resolve(PROJECT_ROOT, env.DB_PATH);

const dbDir = path.dirname(dbFullPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbFullPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// Log where the database is so it's always clear
console.log(`[DB] Using database at: ${dbFullPath}`);

module.exports = db;
