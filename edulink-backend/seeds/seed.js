const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

const FORCE = process.argv.includes('--force');

(async function seed() {
  try {
    const countResult = await pool.query('SELECT COUNT(*) AS count FROM users');
    const userCount = parseInt(countResult.rows[0].count);

    if (userCount > 0 && !FORCE) {
      console.log(`[Seed] Database has ${userCount} users — skipping. Use --force to re-seed.`);
      await pool.end();
      process.exit(0);
    }

    if (FORCE) {
      console.log('[Seed] Wiping existing data...');
      const tables = [
        'notifications', 'reviews', 'payments', 'lessons', 'messages',
        'conversations', 'teacher_classes', 'appointments', 'user_subscriptions',
        'subscriptions', 'tutor_availability', 'tutors', 'users',
      ];
      for (const table of tables) {
        await pool.query(`DELETE FROM ${table}`);
      }
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

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (id, first_name, last_name, email, password_hash, role, interests, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, '[]', $7, $8)`,
        [u.id, u.first_name, u.last_name, u.email, SALT, u.role, now, now]
      );
    }

    // ── Tutor profile for the teacher ───────────────────────
    const tutorId = uuidv4();
    await pool.query(
      `INSERT INTO tutors (id, user_id, name, rating, accent, country, description, is_available, interests, created_at, updated_at)
       VALUES ($1, $2, $3, 0, '', 'au', 'Welcome to EduLink!', 1, '[]', $4, $5)`,
      [tutorId, teacherId, 'Karim Mohammed', now, now]
    );

    console.log('[Seed] Done. Sample accounts created.');
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
