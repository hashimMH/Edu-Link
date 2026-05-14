const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { emitToUser } = require('../config/socket');

const appointmentController = {
  /**
   * GET /api/appointments
   * Get student's appointments
   */
  getMyAppointments(req, res, next) {
    try {
      const appointments = db.prepare(`
        SELECT a.id, a.date, a.day,
               a.start_time, a.end_time, a.status,
               t.id AS tutor_id, t.name AS tutor_name,
               u.avatar_url AS tutor_avatar
        FROM appointments a
        JOIN tutors t ON a.tutor_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE a.student_id = ?
        ORDER BY a.date DESC, a.start_time DESC
      `).all(req.user.id);

      const formatted = appointments.map((a) => ({
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

  /**
   * POST /api/appointments
   * Create appointment
   */
  create(req, res, next) {
    try {
      const { tutorId, day, startTime, endTime, date } = req.body;

      // Validate tutor exists
      const tutor = db.prepare('SELECT id FROM tutors WHERE id = ?').get(tutorId);
      if (!tutor) {
        throw ApiError.notFound('Tutor not found');
      }

      // Check student doesn't double-book themselves
      const studentConflict = db.prepare(`
        SELECT id FROM appointments
        WHERE student_id = ? AND date = ? AND start_time = ? AND status != 'cancelled'
      `).get(req.user.id, date, startTime);

      if (studentConflict) {
        throw ApiError.conflict('You already have an appointment at this time');
      }

      // Check tutor isn't already booked for this date+time by another student
      const tutorConflict = db.prepare(`
        SELECT id FROM appointments
        WHERE tutor_id = ? AND date = ? AND start_time = ? AND status != 'cancelled'
      `).get(tutorId, date, startTime);

      if (tutorConflict) {
        throw ApiError.conflict('This time slot is already booked by another student');
      }

      const id = uuidv4();
      db.prepare(`
        INSERT INTO appointments (id, student_id, tutor_id, date, day, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'upcoming')
      `).run(id, req.user.id, tutorId, date, day, startTime, endTime);

      // Also create a teacher_class entry
      const classId = uuidv4();
      const student = db.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(req.user.id);
      const tutorUser = db.prepare('SELECT user_id FROM tutors WHERE id = ?').get(tutorId);

      db.prepare(`
        INSERT INTO teacher_classes (id, teacher_id, student_id, student_name, appointment_id, date, time, duration, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')
      `).run(classId, tutorUser.user_id, req.user.id,
        `${student.first_name} ${student.last_name}`,
        id, date, `${startTime} - ${endTime}`, '--');

      // Notify student
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body)
        VALUES (?, ?, 'purchase', 'Appointment booked!', ?)
      `).run(uuidv4(), req.user.id, `Your appointment on ${date} at ${startTime} has been booked`);

      // Notify teacher
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body)
        VALUES (?, ?, 'reminder', 'New booking', ?)
      `).run(uuidv4(), tutorUser.user_id, `${student.first_name} booked a class on ${date} at ${startTime}`);

      // Real-time: notify teacher about booking
      emitToUser(tutorUser.user_id, 'new_notification', {
        type: 'reminder',
        title: 'New booking',
        body: `${student.first_name} booked a class on ${date} at ${startTime}`,
        time: 'Just now',
      });

      // Broadcast to all connected clients for admin dashboard refresh
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

  /**
   * DELETE /api/appointments/:id
   */
  delete(req, res, next) {
    try {
      const appointment = db.prepare(
        'SELECT * FROM appointments WHERE id = ? AND student_id = ?'
      ).get(req.params.id, req.user.id);

      if (!appointment) {
        throw ApiError.notFound('Appointment not found');
      }

      db.prepare("UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?")
        .run(req.params.id);

      // Also cancel the teacher class
      db.prepare("UPDATE teacher_classes SET status = 'cancelled', updated_at = datetime('now') WHERE appointment_id = ?")
        .run(req.params.id);

      // Notify student
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body)
        VALUES (?, ?, 'system', 'Appointment cancelled', ?)
      `).run(uuidv4(), req.user.id, `Your appointment on ${appointment.date} has been cancelled`);

      // Notify teacher if user is student
      const tutorUser = db.prepare('SELECT user_id FROM tutors WHERE id = ?').get(appointment.tutor_id);
      if (tutorUser && tutorUser.user_id !== req.user.id) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, body)
          VALUES (?, ?, 'system', 'Booking cancelled', ?)
        `).run(uuidv4(), tutorUser.user_id, `A student cancelled their appointment on ${appointment.date}`);
        
        // Real-time emit to teacher
        emitToUser(tutorUser.user_id, 'new_notification', {
          type: 'system',
          title: 'Booking cancelled',
          body: `A student cancelled their appointment on ${appointment.date}`,
          time: 'Just now',
        });
      }

      // Real-time emit to student
      emitToUser(req.user.id, 'new_notification', {
        type: 'system',
        title: 'Appointment cancelled',
        body: `Your appointment on ${appointment.date} has been cancelled`,
        time: 'Just now',
      });

      // Broadcast for admin dashboard refresh
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
