const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

const FORCE = process.argv.includes('--force');
const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;

if (userCount > 0 && !FORCE) {
  console.log(`[Seed] Database has ${userCount} users — skipping. Use --force to re-seed.`);
  process.exit(0);
}

if (FORCE) {
  console.log('[Seed] Wiping existing data...');
  const tables = [
    'notifications', 'reviews', 'payments', 'lessons', 'messages',
    'conversations', 'teacher_classes', 'appointments', 'user_subscriptions',
    'subscriptions', 'tutor_availability', 'tutors', 'users',
  ];
  for (const table of tables) db.prepare(`DELETE FROM ${table}`).run();
}

console.log('[Seed] Creating sample accounts...');

const SALT = bcrypt.hashSync('password123!', 10);
const now = new Date().toISOString();

// ── Sample Accounts ─────────────────────────────────────
const studentId = uuidv4();
const teacherId = uuidv4();
const adminId   = uuidv4();

const users = [
  { id: studentId, first_name: 'Karim', last_name: 'Mohammed',  email: 'karimshebo15@gmail.com',  role: 'student' },
  { id: teacherId, first_name: 'Karim', last_name: 'Mohammed',  email: 'teacher1@edulink.com',    role: 'teacher' },
  { id: adminId,   first_name: 'Admin', last_name: 'User',      email: 'admin@edulink.com',       role: 'admin'   },
];

const insertUser = db.prepare(`
  INSERT INTO users (id, first_name, last_name, email, password_hash, role, interests, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?)
`);
for (const u of users) {
  insertUser.run(u.id, u.first_name, u.last_name, u.email, SALT, u.role, now, now);
}

// ── Tutor profile for the teacher ───────────────────────
const tutorId = uuidv4();
db.prepare(`
  INSERT INTO tutors (id, user_id, name, rating, accent, country, description, is_available, interests, created_at, updated_at)
  VALUES (?, ?, ?, 0, '', 'au', 'Welcome to EduLink!', 1, '[]', ?, ?)
`).run(tutorId, teacherId, 'Karim Mohammed', now, now);

console.log('[Seed] Done. Sample accounts created.');
process.exit(0);
