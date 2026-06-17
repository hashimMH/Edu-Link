const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

// S3 helper — lazy, won't crash if aws-sdk not installed
let _s3 = null;
function getS3Helper() {
  if (_s3 !== undefined) return _s3;
  try {
    const { uploadToS3, deleteFromS3 } = require('../config/storage');
    _s3 = { upload: uploadToS3, delete: deleteFromS3 };
    return _s3;
  } catch(e) { console.warn('[S3] Not available:', e.message); _s3 = null; return null; }
}

// Ensure upload directories exist
const uploadsDir = path.resolve(__dirname, '../../uploads');
const videosDir = path.join(uploadsDir, 'videos');
const certsDir = path.join(uploadsDir, 'certificates');
const avatarsDir = path.join(uploadsDir, 'avatars');
[videosDir, certsDir, avatarsDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Serve uploaded files statically
function serveUploads(app) {
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, require('express').static(uploadsDir));
}

// Multer config for videos
const videoStorage = multer.diskStorage({
  destination: videosDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only video files allowed (mp4, webm, mov, avi)'));
  },
}).single('video');

// Multer config for certificates
const certStorage = multer.diskStorage({
  destination: certsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const certUpload = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  },
}).single('certificate');

// Multer config for avatars
const avatarStorage = multer.diskStorage({
  destination: avatarsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP, and GIF images allowed'));
  },
}).single('avatar');

const uploadController = {
  /** POST /api/teacher/upload-video */
  uploadVideo(req, res, next) {
    videoUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) return next(ApiError.badRequest(err.message));
        return next(ApiError.badRequest(err.message));
      }
      if (!req.file) return next(ApiError.badRequest('No video file provided'));

      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) return next(ApiError.forbidden('Only teachers can upload videos'));

      let url;
      const s3 = getS3Helper();
      if (s3) {
        url = await s3.upload(req.file.buffer, `videos/${uuidv4()}${path.extname(req.file.originalname)}`, req.file.mimetype);
      } else {
        url = `/uploads/videos/${req.file.filename}`;
      }
      await pool.query('UPDATE tutors SET intro_video_url = $1, updated_at = NOW() WHERE id = $2', [url, tutor.id]);

      res.json({ success: true, data: { url } });
    });
  },

  /** POST /api/teacher/upload-certificate */
  uploadCertificate(req, res, next) {
    certUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) return next(ApiError.badRequest(err.message));
        return next(ApiError.badRequest(err.message));
      }
      if (!req.file) return next(ApiError.badRequest('No file provided'));

      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) return next(ApiError.forbidden('Only teachers can upload certificates'));

      const title = req.body.title || 'Certificate';
      let url;
      const s3 = getS3Helper();
      if (s3) {
        url = await s3.upload(req.file.buffer, `certificates/${uuidv4()}${path.extname(req.file.originalname)}`, req.file.mimetype);
      } else {
        url = `/uploads/certificates/${req.file.filename}`;
      }
      const id = uuidv4();

      await pool.query(
        'INSERT INTO teacher_certificates (id, tutor_id, title, file_url) VALUES ($1, $2, $3, $4)',
        [id, tutor.id, title, url]
      );

      res.status(201).json({ success: true, data: { id, title, url } });
    });
  },

  /** GET /api/teacher/certificates */
  async getCertificates(req, res, next) {
    try {
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) return next(ApiError.forbidden('Only teachers have certificates'));

      const certs = await pool.query(
        'SELECT id, title, file_url, created_at FROM teacher_certificates WHERE tutor_id = $1 ORDER BY created_at DESC',
        [tutor.id]
      );

      res.json({ success: true, data: certs.rows });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/teacher/certificates/:id */
  async deleteCertificate(req, res, next) {
    try {
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) return next(ApiError.forbidden('Only teachers can manage certificates'));

      const certR = await pool.query(
        'SELECT * FROM teacher_certificates WHERE id = $1 AND tutor_id = $2',
        [req.params.id, tutor.id]
      );
      const cert = certR.rows[0];
      if (!cert) return next(ApiError.notFound('Certificate not found'));

      // Delete file
      const filePath = path.join(uploadsDir, cert.file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      // Also delete from S3 if present
      const s3 = getS3Helper();
      try { if (s3 && cert.file_url?.includes('digitaloceanspaces')) await s3.delete(cert.file_url); } catch(_) {}

      await pool.query('DELETE FROM teacher_certificates WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/teacher/tutor-profile */
  async updateTutorProfile(req, res, next) {
    try {
      const tutorR = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
      const tutor = tutorR.rows[0];
      if (!tutor) return next(ApiError.forbidden('Only teachers have tutor profiles'));

      const { bio, experienceYears, accent, description, interests, videoUrl } = req.body;
      const updates = [];
      const params = [];
      let paramIdx = 1;

      if (bio !== undefined) { updates.push(`bio = $${paramIdx++}`); params.push(bio); }
      if (experienceYears !== undefined) { updates.push(`experience_years = $${paramIdx++}`); params.push(parseInt(experienceYears) || 0); }
      if (accent !== undefined) { updates.push(`accent = $${paramIdx++}`); params.push(accent); }
      if (description !== undefined) { updates.push(`description = $${paramIdx++}`); params.push(description); }
      if (videoUrl !== undefined) { updates.push(`intro_video_url = $${paramIdx++}`); params.push(videoUrl); }
      if (interests) { updates.push(`interests = $${paramIdx++}`); params.push(JSON.stringify(interests)); }

      if (updates.length === 0) return next(ApiError.badRequest('No fields to update'));

      updates.push('updated_at = NOW()');
      params.push(tutor.id);

      await pool.query(`UPDATE tutors SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/users/avatar */
  uploadAvatar(req, res, next) {
    avatarUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) return next(ApiError.badRequest(err.message));
        return next(ApiError.badRequest(err.message));
      }
      if (!req.file) return next(ApiError.badRequest('No image file provided'));

      let url;
      const s3 = getS3Helper();
      if (s3) {
        url = await s3.upload(req.file.buffer, `avatars/avatar_${req.user.id}_${Date.now()}${path.extname(req.file.originalname)}`, req.file.mimetype);
      } else {
        url = `/uploads/avatars/${req.file.filename}`;
      }

      // Delete old avatar if exists
      const currentR = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
      const current = currentR.rows[0];
      if (current?.avatar_url && current.avatar_url.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(uploadsDir, current.avatar_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await pool.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [url, req.user.id]);

      res.json({ success: true, data: { avatarUrl: url } });
    });
  },
};

module.exports = { uploadController, serveUploads };
