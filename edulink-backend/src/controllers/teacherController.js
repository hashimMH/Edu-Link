const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');

const teacherController = {
  /**
   * GET /api/teacher/stats
   */
  getStats(req, res, next) {
    try {
      const currentStudents = db.prepare(`
        SELECT COUNT(DISTINCT student_id) AS count
        FROM teacher_classes
        WHERE teacher_id = ? AND status = 'upcoming'
      `).get(req.user.id);

      const bookedClasses = db.prepare(`
        SELECT COUNT(*) AS count FROM teacher_classes
        WHERE teacher_id = ? AND status = 'upcoming'
      `).get(req.user.id);

      const completedClasses = db.prepare(`
        SELECT COUNT(*) AS count FROM teacher_classes
        WHERE teacher_id = ? AND status = 'completed'
      `).get(req.user.id);

      const cancelledClasses = db.prepare(`
        SELECT COUNT(*) AS count FROM teacher_classes
        WHERE teacher_id = ? AND status = 'cancelled'
      `).get(req.user.id);

      const averageRating = db.prepare(`
        SELECT COALESCE(AVG(rating), 0) AS avg FROM reviews WHERE teacher_id = ?
      `).get(req.user.id);

      res.json({
        success: true,
        data: {
          currentStudents: currentStudents.count,
          bookedClasses: bookedClasses.count,
          completedClasses: completedClasses.count,
          cancelledClasses: cancelledClasses.count,
          averageRating: Math.round(averageRating.avg * 10) / 10,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/teacher/classes
   */
  getClasses(req, res, next) {
    try {
      const { status, day } = req.query;
      let sql = `
        SELECT tc.id, tc.student_name, tc.date, tc.time, tc.duration, tc.status,
               tc.appointment_id, u.avatar_url AS student_avatar
        FROM teacher_classes tc
        JOIN users u ON tc.student_id = u.id
        WHERE tc.teacher_id = ?
      `;
      const params = [req.user.id];

      if (status && status !== 'All') {
        sql += ' AND tc.status = ?';
        params.push(status);
      }
      if (day && day !== 'All') {
        sql += " AND tc.date LIKE ?";
        params.push(`${day.substring(0, 3)}%`);
      }

      sql += ' ORDER BY tc.date DESC, tc.time ASC';

      const classes = db.prepare(sql).all(...params);

      const formatted = classes.map((c) => ({
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

  /**
   * GET /api/teacher/upcoming
   */
  getUpcomingClass(req, res, next) {
    try {
      const upcoming = db.prepare(`
        SELECT tc.id, tc.student_name, tc.date, tc.time, tc.duration,
               tc.appointment_id, u.avatar_url AS student_avatar
        FROM teacher_classes tc
        JOIN users u ON tc.student_id = u.id
        WHERE tc.teacher_id = ? AND tc.status = 'upcoming'
        ORDER BY tc.date ASC
        LIMIT 1
      `).get(req.user.id);

      if (!upcoming) {
        return res.json({ success: true, data: null });
      }

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

  /**
   * DELETE /api/teacher/classes/:id
   */
  deleteClass(req, res, next) {
    try {
      const cls = db.prepare(
        'SELECT * FROM teacher_classes WHERE id = ? AND teacher_id = ?'
      ).get(req.params.id, req.user.id);

      if (!cls) {
        throw ApiError.notFound('Class not found');
      }

      db.prepare("UPDATE teacher_classes SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?")
        .run(req.params.id);

      res.json({ success: true, message: 'Class cancelled' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/teacher/availability
   */
  setAvailability(req, res, next) {
    try {
      const { dayOfWeek, startTime, endTime, isRecurring } = req.body;

      // Find tutor id for current user
      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user.id);
      if (!tutor) {
        throw ApiError.forbidden('Only teachers can set availability');
      }

      // Remove existing availability for same day if not recurring add
      const id = uuidv4();
      db.prepare(`
        INSERT INTO tutor_availability (id, tutor_id, day_of_week, start_time, end_time, is_recurring)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, tutor.id, dayOfWeek, startTime, endTime, isRecurring ? 1 : 0);

      res.status(201).json({
        success: true,
        data: { id, dayOfWeek, startTime, endTime, isRecurring: !!isRecurring },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/teacher/availability
   */
  getAvailability(req, res, next) {
    try {
      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user.id);
      if (!tutor) {
        throw ApiError.forbidden('Only teachers have availability');
      }

      const availability = db.prepare(`
        SELECT id, day_of_week, start_time, end_time, is_recurring
        FROM tutor_availability WHERE tutor_id = ?
      `).all(tutor.id);

      res.json({
        success: true,
        data: availability.map((a) => ({
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

  /**
   * DELETE /api/teacher/availability/:id
   */
  deleteAvailability(req, res, next) {
    try {
      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user.id);
      if (!tutor) {
        throw ApiError.forbidden('Only teachers can manage availability');
      }

      const result = db.prepare(
        'DELETE FROM tutor_availability WHERE id = ? AND tutor_id = ?'
      ).run(req.params.id, tutor.id);

      if (result.changes === 0) {
        throw ApiError.notFound('Availability slot not found');
      }

      res.json({ success: true, message: 'Availability slot removed' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = teacherController;
