const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

const sqlFile = path.join(__dirname, '001_initial.sql');
const sql = fs.readFileSync(sqlFile, 'utf-8');

console.log('Running migrations...');
db.exec(sql);
console.log('Migrations completed successfully.');
