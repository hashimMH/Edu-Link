const db = require('../config/database');

const notificationController = {
  /**
   * GET /api/notifications
   */
  getAll(req, res, next) {
    try {
      const notifications = db.prepare(`
        SELECT id, type, title, body, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(req.user.id);

      const formatted = notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        time: formatRelativeTime(n.created_at),
        isRead: !!n.is_read,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/notifications/:id/read
   */
  markRead(req, res, next) {
    try {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
        .run(req.params.id, req.user.id);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/notifications/read-all
   */
  markAllRead(req, res, next) {
    try {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
        .run(req.user.id);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

module.exports = notificationController;
