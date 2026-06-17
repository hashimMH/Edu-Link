const pool = require('../config/database');

const reviewController = {
  /** GET /api/reviews/:teacherId */
  async getByTeacher(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT id, student_name, rating, date, time, comment
         FROM reviews WHERE teacher_id = $1 ORDER BY created_at DESC`,
        [req.params.teacherId]
      );
      res.json({ success: true, data: r.rows });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/reviews/me */
  async getMyReviews(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT id, student_name, rating, date, time, comment
         FROM reviews WHERE teacher_id = $1 ORDER BY created_at DESC`,
        [req.user.id]
      );
      res.json({ success: true, data: r.rows });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reviewController;
