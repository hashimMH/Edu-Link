const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { verifyFirebaseToken, getFirebaseAdmin } = require('../config/firebase');
const token = require('../utils/token');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');

function generateTokens(userId, email, role) {
  const accessToken = token.sign({ id: userId, email, role }, '1h');
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), userId, refreshToken, expiresAt);
  return { accessToken, refreshToken };
}

const firebaseAuthController = {
  /**
   * POST /api/auth/firebase
   * Authenticate with a Firebase ID token (from Google/Apple Sign-In)
   * Body: { idToken, role? }
   * If user doesn't exist, creates one. Always returns our JWT + user data.
   */
  async authenticate(req, res, next) {
    try {
      const { idToken, role = 'student' } = req.body;
      if (!idToken) throw ApiError.badRequest('idToken is required');

      // Verify the Firebase token
      const fbUser = await verifyFirebaseToken(idToken);
      if (!fbUser) {
        const fb = getFirebaseAdmin();
        if (!fb) throw ApiError.unauthorized('Google Sign-In is not configured on the server.');
        throw ApiError.unauthorized('Invalid or expired Firebase token.');
      }

      // Check if user exists by email
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(fbUser.email);

      if (!user) {
        // Create new user
        const id = uuidv4();
        const nameParts = fbUser.name ? fbUser.name.split(' ') : [fbUser.email.split('@')[0], ''];
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        db.prepare(`
          INSERT INTO users (id, first_name, last_name, email, password_hash, role, avatar_url, google_id, is_active)
          VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 1)
        `).run(id, firstName, lastName, fbUser.email, role, fbUser.picture || null, fbUser.uid);

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

        // If role is teacher, create tutor profile
        if (role === 'teacher') {
          const tutorId = uuidv4();
          db.prepare('INSERT INTO tutors (id, user_id, name, interests) VALUES (?, ?, ?, ?)')
            .run(tutorId, id, `${firstName} ${lastName}`, '[]');
        }
      } else {
        // Update google_id and avatar if not set
        if (!user.google_id && fbUser.uid) {
          db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(fbUser.uid, user.id);
        }
        if (!user.avatar_url && fbUser.picture) {
          db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(fbUser.picture, user.id);
        }
      }

      // Generate our JWT + refresh token
      const { accessToken, refreshToken: refToken } = generateTokens(user.id, user.email, user.role);

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
