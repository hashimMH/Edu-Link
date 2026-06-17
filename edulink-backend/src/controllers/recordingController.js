const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

const recordingController = {
  /** GET /api/recordings */
  async list(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT cr.*, tc.student_name, u.first_name || ' ' || u.last_name AS teacher_name
         FROM class_recordings cr
         JOIN teacher_classes tc ON cr.class_id = tc.id
         JOIN users u ON cr.teacher_id = u.id
         WHERE cr.student_id = $1
         ORDER BY cr.created_at DESC`,
        [req.user.id]
      );

      const formatted = r.rows.map(r => ({
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

  /** GET /api/recordings/:id */
  async getDetail(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT cr.*, tc.student_name,
                u.first_name || ' ' || u.last_name AS teacher_name,
                tc.date AS class_date, tc.time AS class_time
         FROM class_recordings cr
         JOIN teacher_classes tc ON cr.class_id = tc.id
         JOIN users u ON cr.teacher_id = u.id
         WHERE cr.id = $1 AND cr.student_id = $2`,
        [req.params.id, req.user.id]
      );
      const recording = r.rows[0];

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

  /** POST /api/recordings */
  async create(req, res, next) {
    try {
      const { classId, title, date, duration, videoUrl } = req.body;
      if (!classId || !title) throw ApiError.badRequest('classId and title are required');

      const clsR = await pool.query(
        'SELECT * FROM teacher_classes WHERE id = $1 AND student_id = $2',
        [classId, req.user.id]
      );
      const cls = clsR.rows[0];
      if (!cls) throw ApiError.notFound('Class not found');

      const id = uuidv4();
      await pool.query(
        `INSERT INTO class_recordings (id, class_id, student_id, teacher_id, title, date, duration, video_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, classId, req.user.id, cls.teacher_id, title, date, duration, videoUrl || null]
      );

      res.status(201).json({ success: true, data: { id } });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/recordings/:id */
  async update(req, res, next) {
    try {
      const { notes } = req.body;
      const recR = await pool.query(
        'SELECT * FROM class_recordings WHERE id = $1 AND student_id = $2',
        [req.params.id, req.user.id]
      );
      const recording = recR.rows[0];

      if (!recording) throw ApiError.notFound('Recording not found');

      const updates = [];
      const params = [];
      let paramIdx = 1;

      if (notes !== undefined) { updates.push(`notes = $${paramIdx++}`); params.push(notes); }

      if (updates.length === 0) throw ApiError.badRequest('No fields to update');

      updates.push('updated_at = NOW()');
      params.push(req.params.id);

      await pool.query(`UPDATE class_recordings SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/recordings/:id */
  async delete(req, res, next) {
    try {
      const result = await pool.query(
        'DELETE FROM class_recordings WHERE id = $1 AND student_id = $2',
        [req.params.id, req.user.id]
      );

      if (result.rowCount === 0) throw ApiError.notFound('Recording not found');
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/recordings/:id/notes */
  async saveNotes(req, res, next) {
    try {
      const { notes } = req.body;
      const recR = await pool.query(
        'SELECT id FROM class_recordings WHERE id = $1 AND student_id = $2',
        [req.params.id, req.user.id]
      );
      const recording = recR.rows[0];

      if (!recording) throw ApiError.notFound('Recording not found');

      await pool.query(
        'UPDATE class_recordings SET notes = $1, updated_at = NOW() WHERE id = $2',
        [notes || '', req.params.id]
      );

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = recordingController;
