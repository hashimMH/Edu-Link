const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

async function isSubscriptionsEnabled() {
  const r = await pool.query("SELECT value FROM system_settings WHERE key = 'subscriptions_enabled'");
  const row = r.rows[0];
  return row?.value === 'true';
}

const subscriptionController = {
  /** GET /api/subscriptions */
  async getAll(req, res, next) {
    try {
      if (!(await isSubscriptionsEnabled())) {
        return res.json({ success: true, data: [], disabled: true });
      }
      const r = await pool.query(
        'SELECT id, title, price, lessons, duration FROM subscriptions WHERE is_active = 1'
      );
      res.json({ success: true, data: r.rows });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/subscriptions/my */
  async getMySubscriptions(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT us.id, us.status, us.started_at, us.expires_at,
                s.title, s.price, s.lessons, s.duration
         FROM user_subscriptions us
         JOIN subscriptions s ON us.subscription_id = s.id
         WHERE us.user_id = $1
         ORDER BY us.started_at DESC`,
        [req.user.id]
      );
      res.json({ success: true, data: r.rows });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/subscriptions/status */
  async getStatus(req, res, next) {
    try {
      res.json({ success: true, data: { enabled: await isSubscriptionsEnabled() } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = subscriptionController;
