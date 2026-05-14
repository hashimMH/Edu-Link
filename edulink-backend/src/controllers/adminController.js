const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

const adminController = {
  // ── Dashboard Stats ────────────────────────────────────────────────
  getStats(req, res, next) {
    try {
      const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get();
      const totalTutors = db.prepare('SELECT COUNT(*) AS count FROM tutors').get();
      const totalStudents = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get();
      const totalTeachers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'teacher'").get();
      const totalAppointments = db.prepare('SELECT COUNT(*) AS count FROM appointments').get();
      const upcomingAppointments = db.prepare("SELECT COUNT(*) AS count FROM appointments WHERE status = 'upcoming'").get();
      const totalLessons = db.prepare('SELECT COUNT(*) AS count FROM lessons').get();
      const totalPayments = db.prepare('SELECT COUNT(*) AS count FROM payments').get();
      const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'").get();
      const totalMessages = db.prepare('SELECT COUNT(*) AS count FROM messages').get();

      // Recent registrations
      const recentUsers = db.prepare(
        'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
      ).all();

      res.json({
        success: true,
        data: {
          totalUsers: totalUsers.count,
          totalTutors: totalTutors.count,
          totalStudents: totalStudents.count,
          totalTeachers: totalTeachers.count,
          totalAppointments: totalAppointments.count,
          upcomingAppointments: upcomingAppointments.count,
          totalLessons: totalLessons.count,
          totalPayments: totalPayments.count,
          totalRevenue: totalRevenue.total,
          totalMessages: totalMessages.count,
          recentUsers,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ── Users CRUD ─────────────────────────────────────────────────────
  getAllUsers(req, res, next) {
    try {
      const { role, search, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = 'SELECT id, first_name, last_name, email, role, is_active, country, created_at FROM users WHERE 1=1';
      const params = [];

      if (role) { sql += ' AND role = ?'; params.push(role); }
      if (search) {
        sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS total FROM');
      const total = db.prepare(countSql).get(...params);

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const users = db.prepare(sql).all(...params);

      res.json({
        success: true,
        data: {
          users: users.map(u => ({
            ...u,
            interests: JSON.parse(u.interests || '[]'),
          })),
          total: total.total,
          page: parseInt(page),
          pages: Math.ceil(total.total / parseInt(limit)),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  createUser(req, res, next) {
    try {
      const { firstName, lastName, email, password, role, country, interests } = req.body;
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) throw ApiError.conflict('Email already exists');

      const id = uuidv4();
      const hash = bcrypt.hashSync(password, SALT_ROUNDS);
      db.prepare(`
        INSERT INTO users (id, first_name, last_name, email, password_hash, role, country, interests)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, firstName, lastName, email, hash, role, country, JSON.stringify(interests || []));

      if (role === 'teacher') {
        const tutorId = uuidv4();
        db.prepare('INSERT INTO tutors (id, user_id, name, interests) VALUES (?, ?, ?, ?)')
          .run(tutorId, id, `${firstName} ${lastName}`, JSON.stringify(interests || []));
      }

      res.status(201).json({ success: true, data: { id } });
    } catch (err) {
      next(err);
    }
  },

  updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, password, role, isActive } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (!user) throw ApiError.notFound('User not found');

      const updates = []; const params = [];
      if (firstName) { updates.push('first_name = ?'); params.push(firstName); }
      if (lastName) { updates.push('last_name = ?'); params.push(lastName); }
      if (email) {
        const dup = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
        if (dup) throw ApiError.conflict('Email already in use');
        updates.push('email = ?'); params.push(email);
      }
      if (password) { updates.push('password_hash = ?'); params.push(bcrypt.hashSync(password, SALT_ROUNDS)); }
      if (role) { updates.push('role = ?'); params.push(role); }
      if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

      if (updates.length === 0) throw ApiError.badRequest('No fields to update');
      updates.push("updated_at = datetime('now')");
      params.push(id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  deleteUser(req, res, next) {
    try {
      const id = req.params.id;
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
      if (!user) throw ApiError.notFound('User not found');

      // Cascade delete all related records
      const tables = [
        'notifications', 'reviews', 'payments', 'lessons',
        'messages', 'conversations', 'teacher_classes', 'appointments',
        'user_subscriptions',
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
      };

      for (const table of tables) {
        const keys = foreignKeys[table];
        const cols = Array.isArray(keys) ? keys : [keys];
        for (const col of cols) {
          db.prepare(`DELETE FROM ${table} WHERE ${col} = ?`).run(id);
        }
      }

      // Also delete appointments where this user is the tutor (via tutors FK)
      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(id);
      if (tutor) {
        db.prepare('DELETE FROM appointments WHERE tutor_id = ?').run(tutor.id);
      }

      // Delete tutor profile if exists
      db.prepare('DELETE FROM tutor_availability WHERE tutor_id IN (SELECT id FROM tutors WHERE user_id = ?)').run(id);
      db.prepare('DELETE FROM tutors WHERE user_id = ?').run(id);

      // Finally delete the user
      db.prepare('DELETE FROM users WHERE id = ?').run(id);

      res.json({ success: true, message: 'User and all related data deleted' });
    } catch (err) {
      next(err);
    }
  },

  // ── Tutors CRUD ────────────────────────────────────────────────────
  getAllTutorsAdmin(req, res, next) {
    try {
      const tutors = db.prepare(`
        SELECT t.*, u.email, u.is_active
        FROM tutors t JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
      `).all();

      res.json({
        success: true,
        data: tutors.map(t => ({
          ...t,
          interests: JSON.parse(t.interests || '[]'),
          is_available: !!t.is_available,
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  updateTutorAdmin(req, res, next) {
    try {
      const { name, accent, country, description, videoUrl, isAvailable, interests, rating } = req.body;
      const updates = []; const params = [];
      if (name) { updates.push('name = ?'); params.push(name); }
      if (accent !== undefined) { updates.push('accent = ?'); params.push(accent); }
      if (country !== undefined) { updates.push('country = ?'); params.push(country); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (videoUrl !== undefined) { updates.push('video_url = ?'); params.push(videoUrl); }
      if (isAvailable !== undefined) { updates.push('is_available = ?'); params.push(isAvailable ? 1 : 0); }
      if (interests) { updates.push('interests = ?'); params.push(JSON.stringify(interests)); }
      if (rating !== undefined) { updates.push('rating = ?'); params.push(rating); }
      if (updates.length === 0) throw ApiError.badRequest('No fields');
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);
      db.prepare(`UPDATE tutors SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // ── Subscriptions CRUD ─────────────────────────────────────────────
  getAllSubscriptionsAdmin(req, res, next) {
    try {
      const subs = db.prepare('SELECT * FROM subscriptions ORDER BY created_at DESC').all();
      res.json({ success: true, data: subs });
    } catch (err) { next(err); }
  },

  createSubscription(req, res, next) {
    try {
      const { title, price, lessons, duration } = req.body;
      db.prepare('INSERT INTO subscriptions (id, title, price, lessons, duration) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), title, price, lessons, duration);
      res.status(201).json({ success: true });
    } catch (err) { next(err); }
  },

  updateSubscription(req, res, next) {
    try {
      const { title, price, lessons, duration, isActive } = req.body;
      const updates = []; const params = [];
      if (title) { updates.push('title = ?'); params.push(title); }
      if (price !== undefined) { updates.push('price = ?'); params.push(price); }
      if (lessons !== undefined) { updates.push('lessons = ?'); params.push(lessons); }
      if (duration !== undefined) { updates.push('duration = ?'); params.push(duration); }
      if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
      if (updates.length === 0) throw ApiError.badRequest('No fields');
      params.push(req.params.id);
      db.prepare(`UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  deleteSubscription(req, res, next) {
    try {
      db.prepare('DELETE FROM subscriptions WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Lessons CRUD ───────────────────────────────────────────────────
  getAllLessonsAdmin(req, res, next) {
    try {
      const lessons = db.prepare(`
        SELECT l.*, u.first_name, u.last_name
        FROM lessons l JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
      `).all();
      res.json({ success: true, data: lessons });
    } catch (err) { next(err); }
  },

  createLesson(req, res, next) {
    try {
      const { userId, title, duration, description, videoUrl } = req.body;
      db.prepare('INSERT INTO lessons (id, user_id, title, duration, description, video_url) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), userId, title, duration, description, videoUrl);
      res.status(201).json({ success: true });
    } catch (err) { next(err); }
  },

  updateLesson(req, res, next) {
    try {
      const { title, duration, description, videoUrl } = req.body;
      const updates = []; const params = [];
      if (title) { updates.push('title = ?'); params.push(title); }
      if (duration) { updates.push('duration = ?'); params.push(duration); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (videoUrl !== undefined) { updates.push('video_url = ?'); params.push(videoUrl); }
      if (updates.length === 0) throw ApiError.badRequest('No fields');
      params.push(req.params.id);
      db.prepare(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  deleteLesson(req, res, next) {
    try {
      db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Appointments ──────────────────────────────────────────────────
  getAllAppointmentsAdmin(req, res, next) {
    try {
      const appts = db.prepare(`
        SELECT a.*, 
               s.first_name AS student_first, s.last_name AS student_last,
               t.name AS tutor_name
        FROM appointments a
        JOIN users s ON a.student_id = s.id
        JOIN tutors t ON a.tutor_id = t.id
        ORDER BY a.date DESC, a.start_time DESC
      `).all();
      res.json({ success: true, data: appts });
    } catch (err) { next(err); }
  },

  // ── Payments ──────────────────────────────────────────────────────
  getAllPaymentsAdmin(req, res, next) {
    try {
      const payments = db.prepare(`
        SELECT p.*, u.first_name, u.last_name, u.email
        FROM payments p JOIN users u ON p.user_id = u.id
        ORDER BY p.date DESC
        LIMIT 200
      `).all();
      res.json({ success: true, data: payments });
    } catch (err) { next(err); }
  },

  // ── Notification Management ──────────────────────────────────────

  /**
   * POST /api/admin/notifications/broadcast
   * Send notification to ALL users
   */
  broadcastNotification(req, res, next) {
    try {
      const { title, body } = req.body;
      if (!title) throw ApiError.badRequest('Title is required');

      const users = db.prepare('SELECT id FROM users WHERE is_active = 1').all();
      const insert = db.prepare('INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, ?, ?, ?)');

      for (const user of users) {
        insert.run(uuidv4(), user.id, 'system', title, body || '');

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

  /**
   * POST /api/admin/notifications/user/:userId
   * Send notification to a specific user
   */
  sendUserNotification(req, res, next) {
    try {
      const { userId } = req.params;
      const { title, body } = req.body;
      if (!title) throw ApiError.badRequest('Title is required');

      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!user) throw ApiError.notFound('User not found');

      db.prepare('INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), userId, 'system', title, body || '');

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
};

module.exports = adminController;
