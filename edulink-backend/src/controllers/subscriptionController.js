const db = require('../config/database');
const ApiError = require('../utils/ApiError');

function isSubscriptionsEnabled() {
  const row = db.prepare(
    "SELECT value FROM system_settings WHERE key = 'subscriptions_enabled'"
  ).get();
  return row?.value === 'true';
}

const subscriptionController = {
  /**
   * GET /api/subscriptions
   * Public — only returns active subscriptions when globally enabled
   */
  getAll(req, res, next) {
    try {
      if (!isSubscriptionsEnabled()) {
        return res.json({ success: true, data: [], disabled: true });
      }
      const subscriptions = db.prepare(
        'SELECT id, title, price, lessons, duration FROM subscriptions WHERE is_active = 1'
      ).all();
      res.json({ success: true, data: subscriptions });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/subscriptions/my
   */
  getMySubscriptions(req, res, next) {
    try {
      const subs = db.prepare(`
        SELECT us.id, us.status, us.started_at, us.expires_at,
               s.title, s.price, s.lessons, s.duration
        FROM user_subscriptions us
        JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ?
        ORDER BY us.started_at DESC
      `).all(req.user.id);
      res.json({ success: true, data: subs });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/subscriptions/status
   * Returns whether subscriptions are globally enabled (for the mobile app)
   */
  getStatus(req, res, next) {
    try {
      res.json({ success: true, data: { enabled: isSubscriptionsEnabled() } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = subscriptionController;
