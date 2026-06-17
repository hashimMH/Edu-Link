const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const pool = require('../config/database');
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
async function generateTokens(userId, email, role) {
  const accessToken = tokenUtil.sign({ id: userId, email, role }, ACCESS_TOKEN_EXPIRY);

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 86400000).toISOString();

  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [uuidv4(), userId, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
}

async function verifyRefreshToken(token) {
  const r = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token = $1 AND revoked = 0 AND expires_at > NOW()`,
    [token]
  );
  return r.rows[0];
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
  async register(req, res, next) {
    try {
      const { email, password, first_name: firstName, last_name: lastName, role, interests } = req.body;

      const existingR = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingR.rows[0]) throw ApiError.conflict('Email already registered');

      const id = uuidv4();
      const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
      const roleVal = role || 'student';
      const interestsJSON = interests ? JSON.stringify(interests) : '[]';

      await pool.query(
        `INSERT INTO users (id, first_name, last_name, email, password_hash, role, interests)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, firstName, lastName, email, passwordHash, roleVal, interestsJSON]
      );

      if (roleVal === 'teacher') {
        const tutorId = uuidv4();
        await pool.query(
          'INSERT INTO tutors (id, user_id, name, interests) VALUES ($1, $2, $3, $4)',
          [tutorId, id, `${firstName} ${lastName}`, interestsJSON]
        );
      }

      const { accessToken, refreshToken } = await generateTokens(id, email, roleVal);

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
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const r = await pool.query(
        `SELECT id, first_name, last_name, email, password_hash, role, interests, avatar_url, country
         FROM users WHERE email = $1 AND is_active = 1`,
        [email]
      );
      const user = r.rows[0];

      if (!user) throw ApiError.unauthorized('Invalid email or password');

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) throw ApiError.unauthorized('Invalid email or password');

      const { accessToken, refreshToken } = await generateTokens(user.id, email, user.role);

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
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw ApiError.badRequest('refreshToken is required');

      const stored = await verifyRefreshToken(refreshToken);
      if (!stored) throw ApiError.unauthorized('Invalid or expired refresh token');

      // Get user before revoking
      const ur = await pool.query(
        'SELECT id, email, role, first_name, last_name, interests, avatar_url, country FROM users WHERE id = $1',
        [stored.user_id]
      );
      const user = ur.rows[0];
      if (!user) throw ApiError.unauthorized('User not found');

      // Issue new tokens FIRST (so crash won't leave user logged out)
      const { accessToken, refreshToken: newRefresh } = await generateTokens(user.id, user.email, user.role);

      // Then revoke old token
      await pool.query('UPDATE refresh_tokens SET revoked = 1 WHERE id = $1', [stored.id]);

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
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await pool.query('UPDATE refresh_tokens SET revoked = 1 WHERE token = $1', [refreshToken]);
      }
      res.json({ success: true, message: 'Logged out' });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/auth/google
   */
  async googleAuth(req, res, next) {
    try {
      const { googleId, email, firstName, lastName } = req.body;
      const r = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);
      let user = r.rows[0];

      if (!user) {
        const id = uuidv4();
        await pool.query(
          `INSERT INTO users (id, first_name, last_name, email, password_hash, role, google_id, interests)
           VALUES ($1, $2, $3, $4, NULL, 'student', $5, '[]')`,
          [id, firstName, lastName, email, googleId]
        );
        user = { id, email, role: 'student', first_name: firstName, last_name: lastName };
      }

      const { accessToken, refreshToken } = await generateTokens(user.id, user.email, user.role);

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
      const r = await pool.query('SELECT id, first_name, email FROM users WHERE email = $1', [email]);
      const user = r.rows[0];

      if (!user) {
        return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      await pool.query(
        `INSERT INTO password_resets (id, user_id, token, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), user.id, resetToken, expiresAt]
      );

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

      const rr = await pool.query(
        `SELECT * FROM password_resets
         WHERE token = $1 AND used = 0 AND expires_at > NOW()`,
        [resetToken]
      );
      const reset = rr.rows[0];

      if (!reset) throw ApiError.badRequest('Invalid or expired reset token');

      const hash = bcrypt.hashSync(password, SALT_ROUNDS);
      await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, reset.user_id]);
      await pool.query('UPDATE password_resets SET used = 1 WHERE id = $1', [reset.id]);

      // Revoke all refresh tokens for security
      await pool.query('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = $1', [reset.user_id]);

      res.json({ success: true, data: { message: 'Password has been reset successfully' } });
    } catch (err) { next(err); }
  },
};

module.exports = authController;
