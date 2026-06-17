const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const { uploadToSpaces, deleteFromSpaces } = require('../config/storage');

// Multer memory storage — files go to S3, not disk
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const videoUpload = memoryUpload.single('video');
const certUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('certificate');
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');

function wrapUpload(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) return next(ApiError.badRequest(err.message));
        return next(ApiError.badRequest(err.message));
      }
      next();
    });
  };
}

const uploadController = {
  /** POST /api/teacher/upload-video */
  async uploadVideo(req, res, next) {
    try {
      if (!req.file) return next(ApiError.badRequest('No video file provided'));

      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) return next(ApiError.forbidden('Only teachers can upload videos'));

      const key = `videos/${uuidv4()}${path.extname(req.file.originalname)}`;
      const url = await uploadToSpaces(req.file.buffer, key, req.file.mimetype);

      // Delete old video from Spaces if exists
      const oldR = await pool.query('SELECT intro_video_url FROM tutors WHERE id = $1', [tutor.id]);
      if (oldR.rows[0]?.intro_video_url?.includes('digitaloceanspaces')) {
        try { await deleteFromSpaces(oldR.rows[0].intro_video_url); } catch (_) {}
      }

      await pool.query('UPDATE tutors SET intro_video_url = $1, updated_at = NOW() WHERE id = $2', [url, tutor.id]);
      res.json({ success: true, data: { url } });
    } catch (err) { next(err); }
  },

  /** POST /api/teacher/upload-certificate */
  async uploadCertificate(req, res, next) {
    try {
      if (!req.file) return next(ApiError.badRequest('No file provided'));

      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) return next(ApiError.forbidden('Only teachers can upload certificates'));

      const key = `certificates/${uuidv4()}${path.extname(req.file.originalname)}`;
      const url = await uploadToSpaces(req.file.buffer, key, req.file.mimetype);

      const title = req.body.title || 'Certificate';
      const id = uuidv4();
      await pool.query(
        'INSERT INTO teacher_certificates (id, tutor_id, title, file_url) VALUES ($1, $2, $3, $4)',
        [id, tutor.id, title, url]
      );

      res.status(201).json({ success: true, data: { id, title, url } });
    } catch (err) { next(err); }
  },

  /** GET /api/teacher/certificates */
  async getCertificates(req, res, next) {
    try {
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      if (!tutorR.rows[0]) return next(ApiError.forbidden('Only teachers have certificates'));

      const certs = await pool.query(
        'SELECT id, title, file_url, created_at FROM teacher_certificates WHERE tutor_id = $1 ORDER BY created_at DESC',
        [tutorR.rows[0].id]
      );
      res.json({ success: true, data: certs.rows });
    } catch (err) { next(err); }
  },

  /** DELETE /api/teacher/certificates/:id */
  async deleteCertificate(req, res, next) {
    try {
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      if (!tutorR.rows[0]) return next(ApiError.forbidden('Only teachers can manage certificates'));

      const certR = await pool.query(
        'SELECT * FROM teacher_certificates WHERE id = $1 AND tutor_id = $2',
        [req.params.id, tutorR.rows[0].id]
      );
      if (!certR.rows[0]) return next(ApiError.notFound('Certificate not found'));

      // Delete from Spaces
      try { await deleteFromSpaces(certR.rows[0].file_url); } catch (_) {}
      await pool.query('DELETE FROM teacher_certificates WHERE id = $1', [req.params.id]);

      res.json({ success: true });
    } catch (err) { next(err); }
  },

  /** PUT /api/teacher/tutor-profile */
  async updateTutorProfile(req, res, next) {
    try {
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      if (!tutorR.rows[0]) return next(ApiError.forbidden('Only teachers have tutor profiles'));

      const { bio, experienceYears, accent, description, interests, videoUrl } = req.body;
      const updates = [];
      const params = [];
      let i = 1;
      if (bio !== undefined) { updates.push(`bio = $${i++}`); params.push(bio); }
      if (experienceYears !== undefined) { updates.push(`experience_years = $${i++}`); params.push(parseInt(experienceYears) || 0); }
      if (accent !== undefined) { updates.push(`accent = $${i++}`); params.push(accent); }
      if (description !== undefined) { updates.push(`description = $${i++}`); params.push(description); }
      if (videoUrl !== undefined) { updates.push(`intro_video_url = $${i++}`); params.push(videoUrl); }
      if (interests) { updates.push(`interests = $${i++}`); params.push(JSON.stringify(interests)); }

      if (!updates.length) return next(ApiError.badRequest('No fields to update'));

      updates.push('updated_at = NOW()');
      params.push(tutorR.rows[0].id);

      await pool.query(`UPDATE tutors SET ${updates.join(', ')} WHERE id = $${i}`, params);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  /** POST /api/users/avatar */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) return next(ApiError.badRequest('No image file provided'));

      const key = `avatars/avatar_${req.user.id}_${Date.now()}${path.extname(req.file.originalname)}`;
      const url = await uploadToSpaces(req.file.buffer, key, req.file.mimetype);

      // Delete old avatar from Spaces
      const oldR = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
      if (oldR.rows[0]?.avatar_url?.includes('digitaloceanspaces')) {
        try { await deleteFromSpaces(oldR.rows[0].avatar_url); } catch (_) {}
      }

      await pool.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [url, req.user.id]);
      res.json({ success: true, data: { avatarUrl: url } });
    } catch (err) { next(err); }
  },
};

module.exports = { uploadController, wrapUpload: (fn) => fn };
