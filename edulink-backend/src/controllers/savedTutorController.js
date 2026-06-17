const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

const savedTutorController = {
  /** GET /api/saved-tutors */
  async list(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT st.id AS saved_id, st.created_at AS saved_at,
                t.id, t.user_id, t.name, t.rating, t.accent, t.country,
                t.description, t.interests, t.is_available,
                t.video_url, t.intro_video_url,
                u.avatar_url AS user_avatar_url
         FROM saved_tutors st
         JOIN tutors t ON st.tutor_id = t.id
         JOIN users u ON t.user_id = u.id
         WHERE st.student_id = $1
         ORDER BY st.created_at DESC`,
        [req.user.id]
      );

      const formatted = r.rows.map(s => ({
        savedId: s.saved_id,
        savedAt: s.saved_at,
        tutor: {
          id: s.id,
          userId: s.user_id,
          name: s.name,
          rating: s.rating,
          accent: s.accent,
          country: s.country,
          description: s.description,
          interests: JSON.parse(s.interests || '[]'),
          isAvailable: !!s.is_available,
          video: s.video_url,
          introVideoUrl: s.intro_video_url,
          videoUrl: s.intro_video_url || s.video_url,
          avatarUrl: s.user_avatar_url,
        },
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/saved-tutors/:tutorId */
  async save(req, res, next) {
    try {
      const { tutorId } = req.params;

      const tutorR = await pool.query('SELECT id FROM tutors WHERE id = $1', [tutorId]);
      if (!tutorR.rows[0]) throw ApiError.notFound('Tutor not found');

      const existingR = await pool.query(
        'SELECT id FROM saved_tutors WHERE student_id = $1 AND tutor_id = $2',
        [req.user.id, tutorId]
      );
      if (existingR.rows[0]) return res.json({ success: true, message: 'Already saved' });

      await pool.query(
        'INSERT INTO saved_tutors (id, student_id, tutor_id) VALUES ($1, $2, $3)',
        [uuidv4(), req.user.id, tutorId]
      );

      res.status(201).json({ success: true, message: 'Tutor saved' });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/saved-tutors/:tutorId */
  async remove(req, res, next) {
    try {
      const { tutorId } = req.params;
      const result = await pool.query(
        'DELETE FROM saved_tutors WHERE student_id = $1 AND tutor_id = $2',
        [req.user.id, tutorId]
      );

      if (result.rowCount === 0) throw ApiError.notFound('Not saved');
      res.json({ success: true, message: 'Removed' });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/saved-tutors/:tutorId/status */
  async checkStatus(req, res, next) {
    try {
      const { tutorId } = req.params;
      const r = await pool.query(
        'SELECT id FROM saved_tutors WHERE student_id = $1 AND tutor_id = $2',
        [req.user.id, tutorId]
      );
      res.json({ success: true, data: { saved: !!r.rows[0] } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = savedTutorController;
