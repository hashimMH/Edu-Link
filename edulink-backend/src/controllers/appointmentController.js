const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const { emitToUser } = require('../config/socket');

const appointmentController = {
  /** GET /api/appointments */
  async getMyAppointments(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT a.id, a.date, a.day,
                a.start_time, a.end_time, a.status,
                t.id AS tutor_id, t.name AS tutor_name,
                u.avatar_url AS tutor_avatar
         FROM appointments a
         JOIN tutors t ON a.tutor_id = t.id
         JOIN users u ON t.user_id = u.id
         WHERE a.student_id = $1
         ORDER BY a.date DESC, a.start_time DESC`,
        [req.user.id]
      );

      const formatted = r.rows.map((a) => ({
        id: a.id,
        date: a.date,
        day: a.day,
        time: `${a.start_time} - ${a.end_time}`,
        status: a.status,
        instructor: {
          id: a.tutor_id,
          name: a.tutor_name,
          role: 'instructor',
          avatar: a.tutor_avatar,
        },
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/appointments */
  async create(req, res, next) {
    try {
      const { tutorId, day, startTime, endTime, date } = req.body;

      const tutorR = await pool.query('SELECT id FROM tutors WHERE id = $1', [tutorId]);
      if (!tutorR.rows[0]) throw ApiError.notFound('Tutor not found');

      // Check student doesn't double-book themselves
      const studentConflictR = await pool.query(
        `SELECT id FROM appointments
         WHERE student_id = $1 AND date = $2 AND start_time = $3 AND status != 'cancelled'`,
        [req.user.id, date, startTime]
      );
      if (studentConflictR.rows[0]) throw ApiError.conflict('You already have an appointment at this time');

      // Check tutor isn't already booked
      const tutorConflictR = await pool.query(
        `SELECT id FROM appointments
         WHERE tutor_id = $1 AND date = $2 AND start_time = $3 AND status != 'cancelled'`,
        [tutorId, date, startTime]
      );
      if (tutorConflictR.rows[0]) throw ApiError.conflict('This time slot is already booked by another student');

      const id = uuidv4();
      await pool.query(
        `INSERT INTO appointments (id, student_id, tutor_id, date, day, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'upcoming')`,
        [id, req.user.id, tutorId, date, day, startTime, endTime]
      );

      // Also create a teacher_class entry
      const classId = uuidv4();
      const studentR = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
      const student = studentR.rows[0];
      const tutorUserR = await pool.query('SELECT user_id FROM tutors WHERE id = $1', [tutorId]);
      const tutorUser = tutorUserR.rows[0];

      await pool.query(
        `INSERT INTO teacher_classes (id, teacher_id, student_id, student_name, appointment_id, date, time, duration, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'upcoming')`,
        [classId, tutorUser.user_id, req.user.id,
         `${student.first_name} ${student.last_name}`,
         id, date, `${startTime} - ${endTime}`, '--']
      );

      // Notify student
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, body)
         VALUES ($1, $2, 'purchase', 'Appointment booked!', $3)`,
        [uuidv4(), req.user.id, `Your appointment on ${date} at ${startTime} has been booked`]
      );

      // Notify teacher
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, body)
         VALUES ($1, $2, 'reminder', 'New booking', $3)`,
        [uuidv4(), tutorUser.user_id, `${student.first_name} booked a class on ${date} at ${startTime}`]
      );

      // Real-time: notify teacher
      emitToUser(tutorUser.user_id, 'new_notification', {
        type: 'reminder',
        title: 'New booking',
        body: `${student.first_name} booked a class on ${date} at ${startTime}`,
        time: 'Just now',
      });

      const { getIO } = require('../config/io');
      const io = getIO();
      if (io) io.emit('appointment_update', { action: 'created', date, tutorId });

      res.status(201).json({
        success: true,
        data: { id, tutorId, day, startTime, endTime, date, status: 'upcoming' },
      });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/appointments/:id */
  async delete(req, res, next) {
    try {
      const r = await pool.query(
        'SELECT * FROM appointments WHERE id = $1 AND student_id = $2',
        [req.params.id, req.user.id]
      );
      const appointment = r.rows[0];

      if (!appointment) throw ApiError.notFound('Appointment not found');

      await pool.query("UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [req.params.id]);
      await pool.query("UPDATE teacher_classes SET status = 'cancelled', updated_at = NOW() WHERE appointment_id = $1", [req.params.id]);

      // Notify student
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, body)
         VALUES ($1, $2, 'system', 'Appointment cancelled', $3)`,
        [uuidv4(), req.user.id, `Your appointment on ${appointment.date} has been cancelled`]
      );

      // Notify teacher if user is student
      const tutorUserR = await pool.query('SELECT user_id FROM tutors WHERE id = $1', [appointment.tutor_id]);
      const tutorUser = tutorUserR.rows[0];
      if (tutorUser && tutorUser.user_id !== req.user.id) {
        await pool.query(
          `INSERT INTO notifications (id, user_id, type, title, body)
           VALUES ($1, $2, 'system', 'Booking cancelled', $3)`,
          [uuidv4(), tutorUser.user_id, `A student cancelled their appointment on ${appointment.date}`]
        );

        emitToUser(tutorUser.user_id, 'new_notification', {
          type: 'system',
          title: 'Booking cancelled',
          body: `A student cancelled their appointment on ${appointment.date}`,
          time: 'Just now',
        });
      }

      emitToUser(req.user.id, 'new_notification', {
        type: 'system',
        title: 'Appointment cancelled',
        body: `Your appointment on ${appointment.date} has been cancelled`,
        time: 'Just now',
      });

      const { getIO } = require('../config/io');
      const io2 = getIO();
      if (io2) io2.emit('appointment_update', { action: 'cancelled', date: appointment.date });

      res.json({ success: true, message: 'Appointment cancelled' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = appointmentController;
