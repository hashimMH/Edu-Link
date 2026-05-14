const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const tokenUtil = require('../utils/token');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

const authController = {
  /**
   * POST /api/auth/register
   * Multi-step compatible: expects { email, password, first_name, last_name, role, interests }
   */
  register(req, res, next) {
    try {
      const { email, password, first_name: firstName, last_name: lastName, role, interests } = req.body;

      // Check existing user
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        throw ApiError.conflict('Email already registered');
      }

      const id = uuidv4();
      const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
      const roleVal = role || 'student';
      const interestsJSON = interests ? JSON.stringify(interests) : '[]';

      db.prepare(`
        INSERT INTO users (id, first_name, last_name, email, password_hash, role, interests)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, firstName, lastName, email, passwordHash, roleVal, interestsJSON);

      // If teacher, create tutor profile
      if (roleVal === 'teacher') {
        const tutorId = uuidv4();
        const fullName = `${firstName} ${lastName}`;
        db.prepare(`
          INSERT INTO tutors (id, user_id, name, interests)
          VALUES (?, ?, ?, ?)
        `).run(tutorId, id, fullName, interestsJSON);
      }

      const token = tokenUtil.sign({ id, email, role: roleVal });

      res.status(201).json({
        success: true,
        data: {
          token,
          user: { id, firstName, lastName, email, role: roleVal, interests: JSON.parse(interestsJSON) },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = db.prepare(`
        SELECT id, first_name, last_name, email, password_hash, role, interests, avatar_url
        FROM users WHERE email = ? AND is_active = 1
      `).get(email);

      if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      const token = tokenUtil.sign({ id: user.id, email: user.email, role: user.role });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            interests: JSON.parse(user.interests || '[]'),
            avatarUrl: user.avatar_url,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/google
   */
  googleAuth(req, res, next) {
    try {
      const { googleId, email, firstName, lastName } = req.body;

      let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleId, email);

      if (!user) {
        const id = uuidv4();
        db.prepare(`
          INSERT INTO users (id, first_name, last_name, email, password_hash, role, google_id, interests)
          VALUES (?, ?, ?, ?, ?, 'student', ?, '[]')
        `).run(id, firstName, lastName, email, '', googleId);
        user = { id, email, role: 'student', first_name: firstName, last_name: lastName };
      }

      const token = tokenUtil.sign({ id: user.id, email: user.email, role: user.role });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            interests: JSON.parse(user.interests || '[]'),
            avatarUrl: user.avatar_url,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
      }

      // In production: generate reset token, store in DB, send email
      // For now, just acknowledge
      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token: resetToken, password } = req.body;
      // In production: verify reset token, find user, update password
      // Placeholder:
      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
