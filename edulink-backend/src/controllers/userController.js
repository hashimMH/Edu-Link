const bcrypt = require('bcryptjs');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

const userController = {
  /**
   * GET /api/users/me
   */
  getProfile(req, res, next) {
    try {
      const user = db.prepare(`
        SELECT id, first_name, last_name, email, role, interests, avatar_url, country, created_at
        FROM users WHERE id = ?
      `).get(req.user.id);

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          interests: JSON.parse(user.interests || '[]'),
          avatarUrl: user.avatar_url,
          country: user.country,
          createdAt: user.created_at,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/users/me
   */
  updateProfile(req, res, next) {
    try {
      const { firstName, lastName, email, password, interests, country } = req.body;
      const userId = req.user.id;

      const current = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

      const updates = [];
      const params = [];

      if (firstName) { updates.push('first_name = ?'); params.push(firstName); }
      if (lastName) { updates.push('last_name = ?'); params.push(lastName); }
      if (email) {
        // Check uniqueness
        const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
        if (existing) throw ApiError.conflict('Email already in use');
        updates.push('email = ?');
        params.push(email);
      }
      if (password) {
        updates.push('password_hash = ?');
        params.push(bcrypt.hashSync(password, SALT_ROUNDS));
      }
      if (interests) {
        updates.push('interests = ?');
        params.push(JSON.stringify(interests));
      }
      if (country) { updates.push('country = ?'); params.push(country); }

      if (updates.length === 0) {
        throw ApiError.badRequest('No fields to update');
      }

      updates.push("updated_at = datetime('now')");
      params.push(userId);

      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      // If user is a teacher, sync the consolidated name to the tutors table
      if (current.role === 'teacher') {
        const updatedFirst = firstName !== undefined ? firstName : current.first_name;
        const updatedLast = lastName !== undefined ? lastName : current.last_name;
        db.prepare('UPDATE tutors SET name = ?, updated_at = datetime(\'now\') WHERE user_id = ?')
          .run(`${updatedFirst} ${updatedLast}`, userId);
      }

      const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

      res.json({
        success: true,
        data: {
          id: updated.id,
          firstName: updated.first_name,
          lastName: updated.last_name,
          email: updated.email,
          role: updated.role,
          interests: JSON.parse(updated.interests || '[]'),
          avatarUrl: updated.avatar_url,
          country: updated.country,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/tutors
   */
  getTutors(req, res, next) {
    try {
      const { search, country, interest, available } = req.query;

      let sql = `SELECT t.*, u.avatar_url AS user_avatar_url, u.first_name || ' ' || u.last_name AS display_name
                 FROM tutors t JOIN users u ON t.user_id = u.id WHERE 1=1`;
      const params = [];

      if (search) {
        sql += " AND (t.name LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (country) {
        sql += " AND t.country = ?";
        params.push(country);
      }
      if (interest) {
        sql += " AND t.interests LIKE ?";
        params.push(`%${interest}%`);
      }
      if (available === 'true') {
        sql += " AND t.is_available = 1";
      }

      sql += ' ORDER BY t.rating DESC';

      const tutors = db.prepare(sql).all(...params);

      const formatted = tutors.map((t) => ({
        id: t.id,
        userId: t.user_id,
        name: t.display_name || t.name,
        rating: t.rating,
        isPositive: t.rating >= 4,
        accent: t.accent,
        interests: JSON.parse(t.interests || '[]'),
        isAvailable: !!t.is_available,
        country: t.country,
        description: t.description,
        bio: t.bio,
        experienceYears: t.experience_years || 0,
        video: t.video_url,
        introVideoUrl: t.intro_video_url,
        videoUrl: t.intro_video_url || t.video_url,
        avatarUrl: t.user_avatar_url,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/tutors/:id
   */
  getTutorById(req, res, next) {
    try {
      const tutor = db.prepare(`
        SELECT t.*, u.avatar_url AS user_avatar_url, u.email, u.first_name || ' ' || u.last_name AS display_name
        FROM tutors t JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
      `).get(req.params.id);

      if (!tutor) {
        throw ApiError.notFound('Tutor not found');
      }

      // Get availability
      const availability = db.prepare(
        'SELECT id, day_of_week, start_time, end_time, is_recurring FROM tutor_availability WHERE tutor_id = ?'
      ).all(req.params.id);

      // Get already-booked slots (upcoming appointments for this tutor)
      const bookedSlots = db.prepare(`
        SELECT date, start_time, end_time
        FROM appointments
        WHERE tutor_id = ? AND status = 'upcoming'
        ORDER BY date, start_time
      `).all(req.params.id);

      res.json({
        success: true,
        data: {
          id: tutor.id,
          userId: tutor.user_id,
          name: tutor.display_name || tutor.name,
          rating: tutor.rating,
          accent: tutor.accent,
          interests: JSON.parse(tutor.interests || '[]'),
          isAvailable: !!tutor.is_available,
          country: tutor.country,
          description: tutor.description,
          bio: tutor.bio,
          experienceYears: tutor.experience_years || 0,
          video: tutor.video_url,               // legacy
          introVideoUrl: tutor.intro_video_url,  // uploaded from dashboard
          videoUrl: tutor.intro_video_url || tutor.video_url,  // unified
          avatarUrl: tutor.user_avatar_url,
          availability: availability.map((a) => ({
            id: a.id,
            dayOfWeek: a.day_of_week,
            startTime: a.start_time,
            endTime: a.end_time,
            isRecurring: !!a.is_recurring,
          })),
          bookedSlots: bookedSlots.map((b) => ({
            date: b.date,
            startTime: b.start_time,
            endTime: b.end_time,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/tutors/names
   * Returns simplified tutor list for message/chat recipient selection
   */
  getTutorNames(req, res, next) {
    try {
      const tutors = db.prepare(`
        SELECT t.id, t.name, t.user_id, u.avatar_url, u.first_name || ' ' || u.last_name AS display_name
        FROM tutors t JOIN users u ON t.user_id = u.id
      `).all();

      res.json({
        success: true,
        data: tutors.map((t) => ({
          id: t.id,
          userId: t.user_id,
          name: t.display_name || t.name,
          avatarUrl: t.user_avatar_url,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
