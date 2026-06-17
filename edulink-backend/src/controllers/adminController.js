const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

const adminController = {
  // ── Dashboard Stats ────────────────────────────────────────────────
  async getStats(req, res, next) {
    try {
      const totalUsers = await pool.query('SELECT COUNT(*) AS count FROM users');
      const totalTutors = await pool.query('SELECT COUNT(*) AS count FROM tutors');
      const totalStudents = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'student'");
      const totalTeachers = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'teacher'");
      const totalAppointments = await pool.query('SELECT COUNT(*) AS count FROM appointments');
      const upcomingAppointments = await pool.query("SELECT COUNT(*) AS count FROM appointments WHERE status = 'upcoming'");
      const totalLessons = await pool.query('SELECT COUNT(*) AS count FROM lessons');
      const totalPayments = await pool.query('SELECT COUNT(*) AS count FROM payments');
      const totalRevenue = await pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'");
      const totalMessages = await pool.query('SELECT COUNT(*) AS count FROM messages');

      // Recent registrations
      const recentUsers = await pool.query(
        'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
      );

      res.json({
        success: true,
        data: {
          totalUsers: parseInt(totalUsers.rows[0].count),
          totalTutors: parseInt(totalTutors.rows[0].count),
          totalStudents: parseInt(totalStudents.rows[0].count),
          totalTeachers: parseInt(totalTeachers.rows[0].count),
          totalAppointments: parseInt(totalAppointments.rows[0].count),
          upcomingAppointments: parseInt(upcomingAppointments.rows[0].count),
          totalLessons: parseInt(totalLessons.rows[0].count),
          totalPayments: parseInt(totalPayments.rows[0].count),
          totalRevenue: parseFloat(totalRevenue.rows[0].total),
          totalMessages: parseInt(totalMessages.rows[0].count),
          recentUsers: recentUsers.rows,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ── Users CRUD ─────────────────────────────────────────────────────
  async getAllUsers(req, res, next) {
    try {
      const { role, search, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = 'SELECT id, first_name, last_name, email, role, is_active, country, interests, avatar_url, created_at FROM users WHERE 1=1';
      const params = [];
      let paramIdx = 1;

      if (role) { sql += ` AND role = $${paramIdx++}`; params.push(role); }
      if (search) {
        sql += ` AND (first_name LIKE $${paramIdx} OR last_name LIKE $${paramIdx+1} OR email LIKE $${paramIdx+2})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramIdx += 3;
      }

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS total FROM');
      const total = await pool.query(countSql, params);

      sql += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(parseInt(limit), offset);

      const users = await pool.query(sql, params);

      res.json({
        success: true,
        data: {
          users: users.rows.map(u => ({
            ...u,
            interests: JSON.parse(u.interests || '[]'),
          })),
          total: parseInt(total.rows[0].total),
          page: parseInt(page),
          pages: Math.ceil(parseInt(total.rows[0].total) / parseInt(limit)),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getUserById(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT id, first_name, last_name, email, role, is_active, country,
                interests, avatar_url, created_at, updated_at
         FROM users WHERE id = $1`,
        [req.params.id]
      );
      const user = r.rows[0];

      if (!user) throw ApiError.notFound('User not found');

      // Get stats
      const apptCount = await pool.query('SELECT COUNT(*) AS count FROM appointments WHERE student_id = $1', [user.id]);
      const lessonCount = await pool.query('SELECT COUNT(*) AS count FROM lessons WHERE user_id = $1', [user.id]);
      const reviewCount = await pool.query('SELECT COUNT(*) AS count FROM reviews WHERE student_id = $1', [user.id]);

      res.json({
        success: true,
        data: {
          ...user,
          interests: JSON.parse(user.interests || '[]'),
          stats: {
            appointments: parseInt(apptCount.rows[0].count),
            lessons: parseInt(lessonCount.rows[0].count),
            reviews: parseInt(reviewCount.rows[0].count),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async createUser(req, res, next) {
    try {
      const { firstName, lastName, email, password, role, country, interests } = req.body;
      const existingR = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingR.rows[0]) throw ApiError.conflict('Email already exists');

      const id = uuidv4();
      const hash = bcrypt.hashSync(password, SALT_ROUNDS);
      await pool.query(
        `INSERT INTO users (id, first_name, last_name, email, password_hash, role, country, interests)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, firstName, lastName, email, hash, role, country, JSON.stringify(interests || [])]
      );

      if (role === 'teacher') {
        const tutorId = uuidv4();
        await pool.query(
          'INSERT INTO tutors (id, user_id, name, interests) VALUES ($1, $2, $3, $4)',
          [tutorId, id, `${firstName} ${lastName}`, JSON.stringify(interests || [])]
        );
      }

      res.status(201).json({ success: true, data: { id } });
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, password, role, isActive } = req.body;
      const r = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      const user = r.rows[0];
      if (!user) throw ApiError.notFound('User not found');

      const updates = []; const params = [];
      let paramIdx = 1;
      if (firstName) { updates.push(`first_name = $${paramIdx++}`); params.push(firstName); }
      if (lastName) { updates.push(`last_name = $${paramIdx++}`); params.push(lastName); }
      if (email) {
        const dupR = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
        if (dupR.rows[0]) throw ApiError.conflict('Email already in use');
        updates.push(`email = $${paramIdx++}`); params.push(email);
      }
      if (password) { updates.push(`password_hash = $${paramIdx++}`); params.push(bcrypt.hashSync(password, SALT_ROUNDS)); }
      if (role) { updates.push(`role = $${paramIdx++}`); params.push(role); }
      if (isActive !== undefined) { updates.push(`is_active = $${paramIdx++}`); params.push(isActive ? 1 : 0); }

      if (updates.length === 0) throw ApiError.badRequest('No fields to update');
      updates.push('updated_at = NOW()');
      params.push(id);

      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const id = req.params.id;
      const r = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
      const user = r.rows[0];
      if (!user) throw ApiError.notFound('User not found');

      // Cascade delete all related records
      const tables = [
        'notifications', 'reviews', 'payments', 'lessons',
        'messages', 'conversations', 'teacher_classes', 'appointments',
        'user_subscriptions', 'refresh_tokens', 'password_resets',
        'saved_tutors', 'class_recordings',
      ];

      const foreignKeys = {
        notifications: 'user_id',
        reviews: ['teacher_id', 'student_id'],
        payments: 'user_id',
        lessons: 'user_id',
        messages: ['sender_id', 'receiver_id'],
        conversations: ['user1_id', 'user2_id'],
        teacher_classes: ['teacher_id', 'student_id'],
        appointments: 'student_id',
        user_subscriptions: 'user_id',
        refresh_tokens: 'user_id',
        password_resets: 'user_id',
        saved_tutors: 'student_id',
        class_recordings: ['student_id', 'teacher_id'],
      };

      for (const table of tables) {
        const keys = foreignKeys[table];
        const cols = Array.isArray(keys) ? keys : [keys];
        for (const col of cols) {
          await pool.query(`DELETE FROM ${table} WHERE ${col} = $1`, [id]);
        }
      }

      // Also delete appointments where this user is the tutor (via tutors FK)
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [id]);
      const tutor = tutorR.rows[0];
      if (tutor) {
        await pool.query('DELETE FROM appointments WHERE tutor_id = $1', [tutor.id]);
      }

      // Delete tutor profile if exists
      await pool.query('DELETE FROM tutor_availability WHERE tutor_id IN (SELECT id FROM tutors WHERE user_id = $1)', [id]);
      await pool.query('DELETE FROM tutors WHERE user_id = $1', [id]);

      // Finally delete the user
      await pool.query('DELETE FROM users WHERE id = $1', [id]);

      res.json({ success: true, message: 'User and all related data deleted' });
    } catch (err) {
      next(err);
    }
  },

  // ── Tutors CRUD ────────────────────────────────────────────────────
  async getAllTutorsAdmin(req, res, next) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = `SELECT t.*, u.email, u.is_active FROM tutors t JOIN users u ON t.user_id = u.id WHERE 1=1`;
      const params = [];
      let paramIdx = 1;

      if (search) {
        sql += ` AND (t.name LIKE $${paramIdx} OR t.accent LIKE $${paramIdx+1} OR t.country LIKE $${paramIdx+2} OR u.email LIKE $${paramIdx+3})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        paramIdx += 4;
      }

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS total FROM');
      const total = await pool.query(countSql, params);

      sql += ` ORDER BY t.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(parseInt(limit), offset);

      const tutors = await pool.query(sql, params);

      res.json({
        success: true,
        data: {
          tutors: tutors.rows.map(t => ({
            ...t,
            interests: JSON.parse(t.interests || '[]'),
            is_available: !!t.is_available,
          })),
          total: parseInt(total.rows[0].total),
          page: parseInt(page),
          pages: Math.ceil(parseInt(total.rows[0].total) / parseInt(limit)),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async updateTutorAdmin(req, res, next) {
    try {
      const { name, accent, country, description, videoUrl, isAvailable, interests, rating } = req.body;
      const updates = []; const params = [];
      let paramIdx = 1;
      if (name) { updates.push(`name = $${paramIdx++}`); params.push(name); }
      if (accent !== undefined) { updates.push(`accent = $${paramIdx++}`); params.push(accent); }
      if (country !== undefined) { updates.push(`country = $${paramIdx++}`); params.push(country); }
      if (description !== undefined) { updates.push(`description = $${paramIdx++}`); params.push(description); }
      if (videoUrl !== undefined) { updates.push(`video_url = $${paramIdx++}`); params.push(videoUrl); }
      if (isAvailable !== undefined) { updates.push(`is_available = $${paramIdx++}`); params.push(isAvailable ? 1 : 0); }
      if (interests) { updates.push(`interests = $${paramIdx++}`); params.push(JSON.stringify(interests)); }
      if (rating !== undefined) { updates.push(`rating = $${paramIdx++}`); params.push(rating); }
      if (updates.length === 0) throw ApiError.badRequest('No fields');
      updates.push('updated_at = NOW()');
      params.push(req.params.id);

      await pool.query(`UPDATE tutors SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // ── Subscriptions CRUD ─────────────────────────────────────────────
  async getAllSubscriptionsAdmin(req, res, next) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = 'SELECT * FROM subscriptions WHERE 1=1';
      const params = [];
      let paramIdx = 1;

      if (search) {
        sql += ` AND (title LIKE $${paramIdx} OR duration LIKE $${paramIdx+1})`;
        params.push(`%${search}%`, `%${search}%`);
        paramIdx += 2;
      }

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS total FROM');
      const total = await pool.query(countSql, params);

      sql += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(parseInt(limit), offset);

      const subs = await pool.query(sql, params);

      res.json({
        success: true,
        data: {
          subscriptions: subs.rows,
          total: parseInt(total.rows[0].total),
          page: parseInt(page),
          pages: Math.ceil(parseInt(total.rows[0].total) / parseInt(limit)),
        },
      });
    } catch (err) { next(err); }
  },

  async createSubscription(req, res, next) {
    try {
      const { title, price, lessons, duration } = req.body;
      await pool.query(
        'INSERT INTO subscriptions (id, title, price, lessons, duration) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), title, price, lessons, duration]
      );
      res.status(201).json({ success: true });
    } catch (err) { next(err); }
  },

  async updateSubscription(req, res, next) {
    try {
      const { title, price, lessons, duration, isActive } = req.body;
      const updates = []; const params = [];
      let paramIdx = 1;
      if (title) { updates.push(`title = $${paramIdx++}`); params.push(title); }
      if (price !== undefined) { updates.push(`price = $${paramIdx++}`); params.push(price); }
      if (lessons !== undefined) { updates.push(`lessons = $${paramIdx++}`); params.push(lessons); }
      if (duration !== undefined) { updates.push(`duration = $${paramIdx++}`); params.push(duration); }
      if (isActive !== undefined) { updates.push(`is_active = $${paramIdx++}`); params.push(isActive ? 1 : 0); }
      if (updates.length === 0) throw ApiError.badRequest('No fields');
      params.push(req.params.id);

      await pool.query(`UPDATE subscriptions SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async deleteSubscription(req, res, next) {
    try {
      await pool.query('DELETE FROM subscriptions WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Global subscriptions master switch ────────────────────────────
  async getSubscriptionsMasterSwitch(req, res, next) {
    try {
      const r = await pool.query("SELECT value FROM system_settings WHERE key = 'subscriptions_enabled'");
      const row = r.rows[0];
      res.json({ success: true, data: { enabled: row?.value === 'true' } });
    } catch (err) { next(err); }
  },

  async toggleSubscriptionsMasterSwitch(req, res, next) {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') throw ApiError.badRequest('enabled (boolean) is required');
      await pool.query(
        "INSERT INTO system_settings (key, value, updated_at) VALUES ('subscriptions_enabled', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = NOW()",
        [enabled ? 'true' : 'false']
      );
      res.json({ success: true, data: { enabled } });
    } catch (err) { next(err); }
  },

  // ── Lessons CRUD ───────────────────────────────────────────────────
  async getAllLessonsAdmin(req, res, next) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = `SELECT l.*, u.first_name, u.last_name FROM lessons l JOIN users u ON l.user_id = u.id WHERE 1=1`;
      const params = [];
      let paramIdx = 1;

      if (search) {
        sql += ` AND (l.title LIKE $${paramIdx} OR u.first_name LIKE $${paramIdx+1} OR u.last_name LIKE $${paramIdx+2})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramIdx += 3;
      }

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS total FROM');
      const total = await pool.query(countSql, params);

      sql += ` ORDER BY l.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(parseInt(limit), offset);

      const lessons = await pool.query(sql, params);

      res.json({
        success: true,
        data: {
          lessons: lessons.rows,
          total: parseInt(total.rows[0].total),
          page: parseInt(page),
          pages: Math.ceil(parseInt(total.rows[0].total) / parseInt(limit)),
        },
      });
    } catch (err) { next(err); }
  },

  async createLesson(req, res, next) {
    try {
      const { userId, title, duration, description, videoUrl } = req.body;
      await pool.query(
        'INSERT INTO lessons (id, user_id, title, duration, description, video_url) VALUES ($1, $2, $3, $4, $5, $6)',
        [uuidv4(), userId, title, duration, description, videoUrl]
      );
      res.status(201).json({ success: true });
    } catch (err) { next(err); }
  },

  async updateLesson(req, res, next) {
    try {
      const { title, duration, description, videoUrl } = req.body;
      const updates = []; const params = [];
      let paramIdx = 1;
      if (title) { updates.push(`title = $${paramIdx++}`); params.push(title); }
      if (duration) { updates.push(`duration = $${paramIdx++}`); params.push(duration); }
      if (description !== undefined) { updates.push(`description = $${paramIdx++}`); params.push(description); }
      if (videoUrl !== undefined) { updates.push(`video_url = $${paramIdx++}`); params.push(videoUrl); }
      if (updates.length === 0) throw ApiError.badRequest('No fields');
      params.push(req.params.id);

      await pool.query(`UPDATE lessons SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async deleteLesson(req, res, next) {
    try {
      await pool.query('DELETE FROM lessons WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Appointments ──────────────────────────────────────────────────
  async getAllAppointmentsAdmin(req, res, next) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = `SELECT a.*, s.first_name AS student_first, s.last_name AS student_last, t.name AS tutor_name FROM appointments a JOIN users s ON a.student_id = s.id JOIN tutors t ON a.tutor_id = t.id WHERE 1=1`;
      const params = [];
      let paramIdx = 1;

      if (search) {
        sql += ` AND (s.first_name LIKE $${paramIdx} OR s.last_name LIKE $${paramIdx+1} OR t.name LIKE $${paramIdx+2} OR a.status LIKE $${paramIdx+3})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        paramIdx += 4;
      }

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS total FROM');
      const total = await pool.query(countSql, params);

      sql += ` ORDER BY a.date DESC, a.start_time DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(parseInt(limit), offset);

      const appts = await pool.query(sql, params);

      res.json({
        success: true,
        data: {
          appointments: appts.rows,
          total: parseInt(total.rows[0].total),
          page: parseInt(page),
          pages: Math.ceil(parseInt(total.rows[0].total) / parseInt(limit)),
        },
      });
    } catch (err) { next(err); }
  },

  // ── Payments ──────────────────────────────────────────────────────
  async getAllPaymentsAdmin(req, res, next) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = `SELECT p.*, u.first_name, u.last_name, u.email FROM payments p JOIN users u ON p.user_id = u.id WHERE 1=1`;
      const params = [];
      let paramIdx = 1;

      if (search) {
        sql += ` AND (u.first_name LIKE $${paramIdx} OR u.last_name LIKE $${paramIdx+1} OR u.email LIKE $${paramIdx+2} OR p.type LIKE $${paramIdx+3} OR p.status LIKE $${paramIdx+4})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        paramIdx += 5;
      }

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS total FROM');
      const total = await pool.query(countSql, params);

      sql += ` ORDER BY p.date DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(parseInt(limit), offset);

      const payments = await pool.query(sql, params);

      res.json({
        success: true,
        data: {
          payments: payments.rows,
          total: parseInt(total.rows[0].total),
          page: parseInt(page),
          pages: Math.ceil(parseInt(total.rows[0].total) / parseInt(limit)),
        },
      });
    } catch (err) { next(err); }
  },

  // ── Notification Management ──────────────────────────────────────

  /** POST /api/admin/notifications/broadcast */
  async broadcastNotification(req, res, next) {
    try {
      const { title, body } = req.body;
      if (!title) throw ApiError.badRequest('Title is required');

      const usersR = await pool.query('SELECT id FROM users WHERE is_active = 1');
      const users = usersR.rows;

      for (const user of users) {
        await pool.query(
          'INSERT INTO notifications (id, user_id, type, title, body) VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), user.id, 'system', title, body || '']
        );

        // Real-time emit to online users
        const { emitToUser } = require('../config/socket');
        emitToUser(user.id, 'new_notification', {
          id: uuidv4(),
          type: 'system',
          title,
          body: body || '',
          time: 'Just now',
        });
      }

      const { getIO } = require('../config/io');
      const io = getIO();
      if (io) io.emit('admin_broadcast', { title, body: body || '' });

      res.json({ success: true, message: `Sent to ${users.length} users` });
    } catch (err) { next(err); }
  },

  /** POST /api/admin/notifications/user/:userId */
  async sendUserNotification(req, res, next) {
    try {
      const { userId } = req.params;
      const { title, body } = req.body;
      if (!title) throw ApiError.badRequest('Title is required');

      const userR = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      const user = userR.rows[0];
      if (!user) throw ApiError.notFound('User not found');

      await pool.query(
        'INSERT INTO notifications (id, user_id, type, title, body) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), userId, 'system', title, body || '']
      );

      const { emitToUser } = require('../config/socket');
      emitToUser(userId, 'new_notification', {
        id: uuidv4(),
        type: 'system',
        title,
        body: body || '',
        time: 'Just now',
      });

      res.json({ success: true, message: 'Notification sent' });
    } catch (err) { next(err); }
  },

  // ── Legal Pages ──────────────────────────────────────────────────
  async getLegalPages(req, res, next) {
    try {
      const pages = await pool.query('SELECT * FROM legal_pages');
      res.json({ success: true, data: pages.rows });
    } catch (err) { next(err); }
  },

  async updateLegalPage(req, res, next) {
    try {
      const { key } = req.params;
      const { title, content } = req.body;
      if (!title && !content) throw ApiError.badRequest('No fields to update');

      const pageR = await pool.query('SELECT key FROM legal_pages WHERE key = $1', [key]);
      if (!pageR.rows[0]) throw ApiError.notFound('Legal page not found');

      const updates = [];
      const params = [];
      let paramIdx = 1;
      if (title) { updates.push(`title = $${paramIdx++}`); params.push(title); }
      if (content !== undefined) { updates.push(`content = $${paramIdx++}`); params.push(content); }
      updates.push('updated_at = NOW()');

      params.push(key);
      await pool.query(`UPDATE legal_pages SET ${updates.join(', ')} WHERE key = $${paramIdx}`, params);
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};

module.exports = adminController;
