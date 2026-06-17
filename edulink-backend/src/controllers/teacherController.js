const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

const teacherController = {
  /** GET /api/teacher/stats */
  async getStats(req, res, next) {
    try {
      const currentStudentsR = await pool.query(
        "SELECT COUNT(DISTINCT student_id) AS count FROM teacher_classes WHERE teacher_id = $1 AND status = 'upcoming'",
        [req.user.id]
      );
      const bookedClassesR = await pool.query(
        "SELECT COUNT(*) AS count FROM teacher_classes WHERE teacher_id = $1 AND status = 'upcoming'",
        [req.user.id]
      );
      const completedClassesR = await pool.query(
        "SELECT COUNT(*) AS count FROM teacher_classes WHERE teacher_id = $1 AND status = 'completed'",
        [req.user.id]
      );
      const cancelledClassesR = await pool.query(
        "SELECT COUNT(*) AS count FROM teacher_classes WHERE teacher_id = $1 AND status = 'cancelled'",
        [req.user.id]
      );
      const avgRatingR = await pool.query(
        'SELECT COALESCE(AVG(rating), 0) AS avg FROM reviews WHERE teacher_id = $1',
        [req.user.id]
      );

      res.json({
        success: true,
        data: {
          currentStudents: parseInt(currentStudentsR.rows[0].count),
          bookedClasses: parseInt(bookedClassesR.rows[0].count),
          completedClasses: parseInt(completedClassesR.rows[0].count),
          cancelledClasses: parseInt(cancelledClassesR.rows[0].count),
          averageRating: Math.round(parseFloat(avgRatingR.rows[0].avg) * 10) / 10,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/teacher/classes */
  async getClasses(req, res, next) {
    try {
      const { status, day } = req.query;
      let sql = `SELECT tc.id, tc.student_name, tc.date, tc.time, tc.duration, tc.status,
                        tc.appointment_id, u.avatar_url AS student_avatar
                 FROM teacher_classes tc
                 JOIN users u ON tc.student_id = u.id
                 WHERE tc.teacher_id = $1`;
      const params = [req.user.id];
      let paramIdx = 2;

      if (status && status !== 'All') {
        sql += ` AND tc.status = $${paramIdx++}`;
        params.push(status);
      }
      if (day && day !== 'All') {
        sql += ` AND tc.date LIKE $${paramIdx++}`;
        params.push(`${day.substring(0, 3)}%`);
      }

      sql += ' ORDER BY tc.date DESC, tc.time ASC';

      const r = await pool.query(sql, params);

      const formatted = r.rows.map((c) => ({
        id: c.id,
        appointmentId: c.appointment_id,
        studentName: c.student_name,
        studentImage: c.student_avatar,
        date: c.date,
        time: c.time,
        duration: c.duration,
        status: c.status,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/teacher/upcoming */
  async getUpcomingClass(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT tc.id, tc.student_name, tc.date, tc.time, tc.duration,
                tc.appointment_id, u.avatar_url AS student_avatar
         FROM teacher_classes tc
         JOIN users u ON tc.student_id = u.id
         WHERE tc.teacher_id = $1 AND tc.status = 'upcoming'
         ORDER BY tc.date ASC LIMIT 1`,
        [req.user.id]
      );
      const upcoming = r.rows[0];

      if (!upcoming) return res.json({ success: true, data: null });

      res.json({
        success: true,
        data: {
          id: upcoming.id,
          appointmentId: upcoming.appointment_id,
          studentName: upcoming.student_name,
          studentImage: upcoming.student_avatar,
          dateTime: `${upcoming.date} ${upcoming.time}`,
          duration: upcoming.duration,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/teacher/classes/:id */
  async deleteClass(req, res, next) {
    try {
      const r = await pool.query(
        'SELECT * FROM teacher_classes WHERE id = $1 AND teacher_id = $2',
        [req.params.id, req.user.id]
      );
      const cls = r.rows[0];

      if (!cls) throw ApiError.notFound('Class not found');

      await pool.query("UPDATE teacher_classes SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [req.params.id]);

      res.json({ success: true, message: 'Class cancelled' });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/teacher/availability */
  async setAvailability(req, res, next) {
    try {
      const { dayOfWeek, startTime, endTime, isRecurring } = req.body;

      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) throw ApiError.forbidden('Only teachers can set availability');

      const id = uuidv4();
      await pool.query(
        `INSERT INTO tutor_availability (id, tutor_id, day_of_week, start_time, end_time, is_recurring)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, tutor.id, dayOfWeek, startTime, endTime, isRecurring ? 1 : 0]
      );

      res.status(201).json({
        success: true,
        data: { id, dayOfWeek, startTime, endTime, isRecurring: !!isRecurring },
      });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/teacher/availability */
  async getAvailability(req, res, next) {
    try {
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) throw ApiError.forbidden('Only teachers have availability');

      const r = await pool.query(
        `SELECT id, day_of_week, start_time, end_time, is_recurring
         FROM tutor_availability WHERE tutor_id = $1`,
        [tutor.id]
      );

      res.json({
        success: true,
        data: r.rows.map((a) => ({
          id: a.id,
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time,
          isRecurring: !!a.is_recurring,
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/teacher/availability/:id */
  async deleteAvailability(req, res, next) {
    try {
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) throw ApiError.forbidden('Only teachers can manage availability');

      const result = await pool.query(
        'DELETE FROM tutor_availability WHERE id = $1 AND tutor_id = $2',
        [req.params.id, tutor.id]
      );

      if (result.rowCount === 0) throw ApiError.notFound('Availability slot not found');

      res.json({ success: true, message: 'Availability slot removed' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = teacherController;
