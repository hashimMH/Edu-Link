const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');

const recordingController = {
  /**
   * GET /api/recordings
   * List all recordings for the authenticated student
   */
  list(req, res, next) {
    try {
      const recordings = db.prepare(`
        SELECT cr.*, tc.student_name, u.first_name || ' ' || u.last_name AS teacher_name
        FROM class_recordings cr
        JOIN teacher_classes tc ON cr.class_id = tc.id
        JOIN users u ON cr.teacher_id = u.id
        WHERE cr.student_id = ?
        ORDER BY cr.created_at DESC
      `).all(req.user.id);

      const formatted = recordings.map(r => ({
        id: r.id,
        classId: r.class_id,
        title: r.title,
        date: r.date,
        duration: r.duration,
        videoUrl: r.video_url,
        thumbnailUrl: r.thumbnail_url,
        teacherName: r.teacher_name,
        hasNotes: !!(r.notes || r.teacher_notes),
        hasMaterials: !!(r.materials && r.materials !== '[]'),
        createdAt: r.created_at,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/recordings/:id
   * Get recording detail with notes and materials
   */
  getDetail(req, res, next) {
    try {
      const recording = db.prepare(`
        SELECT cr.*, tc.student_name,
               u.first_name || ' ' || u.last_name AS teacher_name,
               tc.date AS class_date, tc.time AS class_time
        FROM class_recordings cr
        JOIN teacher_classes tc ON cr.class_id = tc.id
        JOIN users u ON cr.teacher_id = u.id
        WHERE cr.id = ? AND cr.student_id = ?
      `).get(req.params.id, req.user.id);

      if (!recording) throw ApiError.notFound('Recording not found');

      res.json({
        success: true,
        data: {
          id: recording.id,
          classId: recording.class_id,
          title: recording.title,
          date: recording.date,
          duration: recording.duration,
          videoUrl: recording.video_url,
          thumbnailUrl: recording.thumbnail_url,
          teacherName: recording.teacher_name,
          classDate: recording.class_date,
          classTime: recording.class_time,
          notes: recording.notes || '',
          teacherNotes: recording.teacher_notes || '',
          materials: JSON.parse(recording.materials || '[]'),
          createdAt: recording.created_at,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/recordings
   * Create a new recording entry
   */
  create(req, res, next) {
    try {
      const { classId, title, date, duration, videoUrl } = req.body;
      if (!classId || !title) throw ApiError.badRequest('classId and title are required');

      // Verify the class belongs to this student
      const cls = db.prepare(
        'SELECT * FROM teacher_classes WHERE id = ? AND student_id = ?'
      ).get(classId, req.user.id);
      if (!cls) throw ApiError.notFound('Class not found');

      const id = uuidv4();
      db.prepare(`
        INSERT INTO class_recordings (id, class_id, student_id, teacher_id, title, date, duration, video_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, classId, req.user.id, cls.teacher_id, title, date, duration, videoUrl || null);

      res.status(201).json({ success: true, data: { id } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/recordings/:id
   * Update recording notes
   */
  update(req, res, next) {
    try {
      const { notes } = req.body;
      const recording = db.prepare(
        'SELECT * FROM class_recordings WHERE id = ? AND student_id = ?'
      ).get(req.params.id, req.user.id);

      if (!recording) throw ApiError.notFound('Recording not found');

      const updates = [];
      const params = [];

      if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

      if (updates.length === 0) throw ApiError.badRequest('No fields to update');

      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);

      db.prepare(`UPDATE class_recordings SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/recordings/:id
   */
  delete(req, res, next) {
    try {
      const result = db.prepare(
        'DELETE FROM class_recordings WHERE id = ? AND student_id = ?'
      ).run(req.params.id, req.user.id);

      if (result.changes === 0) throw ApiError.notFound('Recording not found');
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/recordings/:id/notes
   * Save personal notes for a recording
   */
  saveNotes(req, res, next) {
    try {
      const { notes } = req.body;
      const recording = db.prepare(
        'SELECT id FROM class_recordings WHERE id = ? AND student_id = ?'
      ).get(req.params.id, req.user.id);

      if (!recording) throw ApiError.notFound('Recording not found');

      db.prepare("UPDATE class_recordings SET notes = ?, updated_at = datetime('now') WHERE id = ?")
        .run(notes || '', req.params.id);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = recordingController;
