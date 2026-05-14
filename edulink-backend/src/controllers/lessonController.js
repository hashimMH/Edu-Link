const db = require('../config/database');
const ApiError = require('../utils/ApiError');

const lessonController = {
  /**
   * GET /api/lessons/history
   */
  getHistory(req, res, next) {
    try {
      const { sort } = req.query;
      const order = sort === 'oldest' ? 'ASC' : 'DESC';

      const lessons = db.prepare(`
        SELECT id, title, duration, description, video_url, created_at
        FROM lessons
        WHERE user_id = ?
        ORDER BY created_at ${order}
      `).all(req.user.id);

      const formatted = lessons.map((l) => ({
        id: l.id,
        title: l.title,
        duration: l.duration,
        description: l.description,
        createdAt: l.created_at,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = lessonController;
