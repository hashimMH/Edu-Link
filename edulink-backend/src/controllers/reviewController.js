const db = require('../config/database');

const reviewController = {
  /**
   * GET /api/reviews/:teacherId
   */
  getByTeacher(req, res, next) {
    try {
      const reviews = db.prepare(`
        SELECT id, student_name, rating, date, time, comment
        FROM reviews
        WHERE teacher_id = ?
        ORDER BY created_at DESC
      `).all(req.params.teacherId);

      res.json({ success: true, data: reviews });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/reviews/me
   * Get reviews for current user (when they are a teacher)
   */
  getMyReviews(req, res, next) {
    try {
      const reviews = db.prepare(`
        SELECT id, student_name, rating, date, time, comment
        FROM reviews
        WHERE teacher_id = ?
        ORDER BY created_at DESC
      `).all(req.user.id);

      res.json({ success: true, data: reviews });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reviewController;
