const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

const userController = {
  /** GET /api/users/me */
  async getProfile(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT id, first_name, last_name, email, role, interests, avatar_url, country, created_at
         FROM users WHERE id = $1`,
        [req.user.id]
      );
      const user = r.rows[0];

      if (!user) throw ApiError.notFound('User not found');

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

  /** PUT /api/users/me */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, email, password, interests, country } = req.body;
      const userId = req.user.id;

      const currentR = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      const current = currentR.rows[0];

      const updates = [];
      const params = [];
      let paramIdx = 1;

      if (firstName) { updates.push(`first_name = $${paramIdx++}`); params.push(firstName); }
      if (lastName) { updates.push(`last_name = $${paramIdx++}`); params.push(lastName); }
      if (email) {
        const existingR = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
        if (existingR.rows[0]) throw ApiError.conflict('Email already in use');
        updates.push(`email = $${paramIdx++}`);
        params.push(email);
      }
      if (password) {
        updates.push(`password_hash = $${paramIdx++}`);
        params.push(bcrypt.hashSync(password, SALT_ROUNDS));
      }
      if (interests) {
        updates.push(`interests = $${paramIdx++}`);
        params.push(JSON.stringify(interests));
      }
      if (country) { updates.push(`country = $${paramIdx++}`); params.push(country); }

      if (updates.length === 0) throw ApiError.badRequest('No fields to update');

      updates.push('updated_at = NOW()');
      params.push(userId);

      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);

      // If user is a teacher, sync the consolidated name to the tutors table
      if (current.role === 'teacher') {
        const updatedFirst = firstName !== undefined ? firstName : current.first_name;
        const updatedLast = lastName !== undefined ? lastName : current.last_name;
        await pool.query('UPDATE tutors SET name = $1, updated_at = NOW() WHERE user_id = $2',
          [`${updatedFirst} ${updatedLast}`, userId]);
      }

      const updatedR = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      const updated = updatedR.rows[0];

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

  /** GET /api/users/tutors */
  async getTutors(req, res, next) {
    try {
      const { search, country, interest, available } = req.query;

      let sql = `SELECT t.*, u.avatar_url AS user_avatar_url, u.first_name || ' ' || u.last_name AS display_name
                 FROM tutors t JOIN users u ON t.user_id = u.id WHERE 1=1`;
      const params = [];
      let paramIdx = 1;

      if (search) {
        sql += ` AND (t.name LIKE $${paramIdx} OR u.first_name LIKE $${paramIdx+1} OR u.last_name LIKE $${paramIdx+2})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramIdx += 3;
      }
      if (country) {
        sql += ` AND t.country = $${paramIdx++}`;
        params.push(country);
      }
      if (interest) {
        sql += ` AND t.interests LIKE $${paramIdx++}`;
        params.push(`%${interest}%`);
      }
      if (available === 'true') {
        sql += ' AND t.is_available = 1';
      }

      sql += ' ORDER BY t.rating DESC';

      const r = await pool.query(sql, params);

      const formatted = r.rows.map((t) => ({
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

  /** GET /api/users/tutors/:id */
  async getTutorById(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT t.*, u.avatar_url AS user_avatar_url, u.email, u.first_name || ' ' || u.last_name AS display_name
         FROM tutors t JOIN users u ON t.user_id = u.id
         WHERE t.id = $1`,
        [req.params.id]
      );
      const tutor = r.rows[0];

      if (!tutor) throw ApiError.notFound('Tutor not found');

      // Get availability
      const availR = await pool.query(
        'SELECT id, day_of_week, start_time, end_time, is_recurring FROM tutor_availability WHERE tutor_id = $1',
        [req.params.id]
      );

      // Get already-booked slots
      const bookedR = await pool.query(
        "SELECT date, start_time, end_time FROM appointments WHERE tutor_id = $1 AND status = 'upcoming' ORDER BY date, start_time",
        [req.params.id]
      );

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
          video: tutor.video_url,
          introVideoUrl: tutor.intro_video_url,
          videoUrl: tutor.intro_video_url || tutor.video_url,
          avatarUrl: tutor.user_avatar_url,
          availability: availR.rows.map((a) => ({
            id: a.id,
            dayOfWeek: a.day_of_week,
            startTime: a.start_time,
            endTime: a.end_time,
            isRecurring: !!a.is_recurring,
          })),
          bookedSlots: bookedR.rows.map((b) => ({
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

  /** GET /api/users/tutors/names */
  async getTutorNames(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT t.id, t.name, t.user_id, u.avatar_url, u.first_name || ' ' || u.last_name AS display_name
         FROM tutors t JOIN users u ON t.user_id = u.id`
      );

      res.json({
        success: true,
        data: r.rows.map((t) => ({
          id: t.id,
          userId: t.user_id,
          name: t.display_name || t.name,
          avatarUrl: t.avatar_url,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
