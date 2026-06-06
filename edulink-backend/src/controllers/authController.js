const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../config/database');
const tokenUtil = require('../utils/token');
const ApiError = require('../utils/ApiError');
const { sendEmail } = require('../services/email');

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_DAYS = 7;

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Generate an access + refresh token pair for a user.
 * Access token: short-lived JWT (1h)
 * Refresh token: random hex, stored in DB, valid for 7 days
 */
function generateTokens(userId, email, role) {
  const accessToken = tokenUtil.sign({ id: userId, email, role }, ACCESS_TOKEN_EXPIRY);

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 86400000).toISOString();

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), userId, refreshToken, expiresAt);

  return { accessToken, refreshToken };
}

function verifyRefreshToken(token) {
  return db.prepare(`
    SELECT * FROM refresh_tokens
    WHERE token = ? AND revoked = 0 AND expires_at > datetime('now')
  `).get(token);
}

function formatUser(user) {
  return {
    id: user.id || user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    interests: JSON.parse(user.interests || '[]'),
    avatarUrl: user.avatar_url,
    country: user.country,
  };
}

// ── Auth Controller ──────────────────────────────────────────────────

const authController = {
  /**
   * POST /api/auth/register
   */
  register(req, res, next) {
    try {
      const { email, password, first_name: firstName, last_name: lastName, role, interests } = req.body;

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) throw ApiError.conflict('Email already registered');

      const id = uuidv4();
      const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
      const roleVal = role || 'student';
      const interestsJSON = interests ? JSON.stringify(interests) : '[]';

      db.prepare(`
        INSERT INTO users (id, first_name, last_name, email, password_hash, role, interests)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, firstName, lastName, email, passwordHash, roleVal, interestsJSON);

      if (roleVal === 'teacher') {
        const tutorId = uuidv4();
        db.prepare('INSERT INTO tutors (id, user_id, name, interests) VALUES (?, ?, ?, ?)')
          .run(tutorId, id, `${firstName} ${lastName}`, interestsJSON);
      }

      const { accessToken, refreshToken } = generateTokens(id, email, roleVal);

      res.status(201).json({
        success: true,
        data: {
          token: accessToken,
          refreshToken,
          user: { id, firstName, lastName, email, role: roleVal, interests: JSON.parse(interestsJSON) },
        },
      });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/auth/login
   */
  login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = db.prepare(`
        SELECT id, first_name, last_name, email, password_hash, role, interests, avatar_url, country
        FROM users WHERE email = ? AND is_active = 1
      `).get(email);

      if (!user) throw ApiError.unauthorized('Invalid email or password');

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) throw ApiError.unauthorized('Invalid email or password');

      const { accessToken, refreshToken } = generateTokens(user.id, email, user.role);

      res.json({
        success: true,
        data: { token: accessToken, refreshToken, user: formatUser(user) },
      });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/auth/refresh
   * Exchange a valid refresh token for new access + refresh tokens
   */
  refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw ApiError.badRequest('refreshToken is required');

      const stored = verifyRefreshToken(refreshToken);
      if (!stored) throw ApiError.unauthorized('Invalid or expired refresh token');

      // Get user before revoking
      const user = db.prepare(
        'SELECT id, email, role, first_name, last_name, interests, avatar_url, country FROM users WHERE id = ?'
      ).get(stored.user_id);
      if (!user) throw ApiError.unauthorized('User not found');

      // Issue new tokens FIRST (so crash won't leave user logged out)
      const { accessToken, refreshToken: newRefresh } = generateTokens(user.id, user.email, user.role);

      // Then revoke old token
      db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?").run(stored.id);

      res.json({
        success: true,
        data: { token: accessToken, refreshToken: newRefresh, user: formatUser(user) },
      });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/auth/logout
   * Revoke a specific refresh token
   */
  logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?").run(refreshToken);
      }
      res.json({ success: true, message: 'Logged out' });
    } catch (err) { next(err); }
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
          VALUES (?, ?, ?, ?, NULL, 'student', ?, '[]')
        `).run(id, firstName, lastName, email, googleId);
        user = { id, email, role: 'student', first_name: firstName, last_name: lastName };
      }

      const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

      res.json({
        success: true,
        data: { token: accessToken, refreshToken, user: formatUser(user) },
      });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = db.prepare('SELECT id, first_name, email FROM users WHERE email = ?').get(email);

      if (!user) {
        return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      db.prepare(`
        INSERT INTO password_resets (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), user.id, resetToken, expiresAt);

      // Send email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3003'}/reset-password?token=${resetToken}`;
      sendEmail({
        to: user.email,
        subject: 'Reset your EduLink password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #10A7DA;">EduLink</h2>
            <p>Hi ${user.first_name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #10A7DA; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Reset Password</a>
            <p style="color: #666; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 11px;">EduLink Learning Platform</p>
          </div>
        `,
      }).catch(err => console.error('[Email] Failed:', err.message));

      res.json({
        success: true,
        data: {
          message: 'If the email exists, a reset link has been sent',
          // Only include token in dev mode for testing
          ...(process.env.NODE_ENV === 'development' ? { resetToken } : {}),
        },
      });
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
      if (!resetToken || !password) throw ApiError.badRequest('Token and password are required');
      if (password.length < 6) throw ApiError.badRequest('Password must be at least 6 characters');

      const reset = db.prepare(`
        SELECT * FROM password_resets
        WHERE token = ? AND used = 0 AND expires_at > datetime('now')
      `).get(resetToken);

      if (!reset) throw ApiError.badRequest('Invalid or expired reset token');

      const hash = bcrypt.hashSync(password, SALT_ROUNDS);
      db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
        .run(hash, reset.user_id);
      db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(reset.id);

      // Revoke all refresh tokens for security
      db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?").run(reset.user_id);

      res.json({ success: true, data: { message: 'Password has been reset successfully' } });
    } catch (err) { next(err); }
  },
};

module.exports = authController;
