const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');

const savedTutorController = {
  /**
   * GET /api/saved-tutors
   * List all saved tutors for the authenticated student
   */
  list(req, res, next) {
    try {
      const saved = db.prepare(`
        SELECT st.id AS saved_id, st.created_at AS saved_at,
               t.id, t.user_id, t.name, t.rating, t.accent, t.country,
               t.description, t.interests, t.is_available,
               t.video_url, t.intro_video_url,
               u.avatar_url AS user_avatar_url
        FROM saved_tutors st
        JOIN tutors t ON st.tutor_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE st.student_id = ?
        ORDER BY st.created_at DESC
      `).all(req.user.id);

      const formatted = saved.map(s => ({
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

  /**
   * POST /api/saved-tutors/:tutorId
   * Save/bookmark a tutor
   */
  save(req, res, next) {
    try {
      const { tutorId } = req.params;

      const tutor = db.prepare('SELECT id FROM tutors WHERE id = ?').get(tutorId);
      if (!tutor) throw ApiError.notFound('Tutor not found');

      const existing = db.prepare(
        'SELECT id FROM saved_tutors WHERE student_id = ? AND tutor_id = ?'
      ).get(req.user.id, tutorId);

      if (existing) {
        return res.json({ success: true, message: 'Already saved' });
      }

      db.prepare('INSERT INTO saved_tutors (id, student_id, tutor_id) VALUES (?, ?, ?)')
        .run(uuidv4(), req.user.id, tutorId);

      res.status(201).json({ success: true, message: 'Tutor saved' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/saved-tutors/:tutorId
   * Remove a saved tutor
   */
  remove(req, res, next) {
    try {
      const { tutorId } = req.params;
      const result = db.prepare(
        'DELETE FROM saved_tutors WHERE student_id = ? AND tutor_id = ?'
      ).run(req.user.id, tutorId);

      if (result.changes === 0) throw ApiError.notFound('Not saved');
      res.json({ success: true, message: 'Removed' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/saved-tutors/:tutorId/status
   * Check if a specific tutor is saved
   */
  checkStatus(req, res, next) {
    try {
      const { tutorId } = req.params;
      const row = db.prepare(
        'SELECT id FROM saved_tutors WHERE student_id = ? AND tutor_id = ?'
      ).get(req.user.id, tutorId);

      res.json({ success: true, data: { saved: !!row } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = savedTutorController;
