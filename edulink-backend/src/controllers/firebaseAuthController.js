const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { verifyFirebaseToken, getFirebaseAdmin } = require('../config/firebase');
const token = require('../utils/token');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');

async function generateTokens(userId, email, role) {
  const accessToken = token.sign({ id: userId, email, role }, '1h');
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  await pool.query(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
    [uuidv4(), userId, refreshToken, expiresAt]
  );
  return { accessToken, refreshToken };
}

const firebaseAuthController = {
  /** POST /api/auth/firebase */
  async authenticate(req, res, next) {
    try {
      const { idToken, role = 'student' } = req.body;
      if (!idToken) throw ApiError.badRequest('idToken is required');

      const fbUser = await verifyFirebaseToken(idToken);
      if (!fbUser) {
        const fb = getFirebaseAdmin();
        if (!fb) throw ApiError.unauthorized('Google Sign-In is not configured on the server.');
        throw ApiError.unauthorized('Invalid or expired Firebase token.');
      }

      // Check if user exists by email
      const existingR = await pool.query('SELECT * FROM users WHERE email = $1', [fbUser.email]);
      let user = existingR.rows[0];

      if (!user) {
        const id = uuidv4();
        const nameParts = fbUser.name ? fbUser.name.split(' ') : [fbUser.email.split('@')[0], ''];
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        await pool.query(
          `INSERT INTO users (id, first_name, last_name, email, password_hash, role, avatar_url, google_id, is_active)
           VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, 1)`,
          [id, firstName, lastName, fbUser.email, role, fbUser.picture || null, fbUser.uid]
        );

        const newUserR = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        user = newUserR.rows[0];

        if (role === 'teacher') {
          const tutorId = uuidv4();
          await pool.query(
            'INSERT INTO tutors (id, user_id, name, interests) VALUES ($1, $2, $3, $4)',
            [tutorId, id, `${firstName} ${lastName}`, '[]']
          );
        }
      } else {
        if (!user.google_id && fbUser.uid) {
          await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [fbUser.uid, user.id]);
        }
        if (!user.avatar_url && fbUser.picture) {
          await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [fbUser.picture, user.id]);
        }
      }

      const { accessToken, refreshToken: refToken } = await generateTokens(user.id, user.email, user.role);

      res.json({
        success: true,
        data: {
          token: accessToken,
          refreshToken: refToken,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            interests: JSON.parse(user.interests || '[]'),
            avatarUrl: user.avatar_url || fbUser.picture || null,
            country: user.country,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = firebaseAuthController;
