const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');

// Ensure upload directories exist
const uploadsDir = path.resolve(__dirname, '../../uploads');
const videosDir = path.join(uploadsDir, 'videos');
const certsDir = path.join(uploadsDir, 'certificates');
[videosDir, certsDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  },
}).single('certificate');

const uploadController = {
  /**
   * POST /api/teacher/upload-video
   */
  uploadVideo(req, res, next) {
    videoUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) return next(ApiError.badRequest(err.message));
        return next(ApiError.badRequest(err.message));
      }
      if (!req.file) return next(ApiError.badRequest('No video file provided'));

      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user.id);
      if (!tutor) return next(ApiError.forbidden('Only teachers can upload videos'));

      const url = `/uploads/videos/${req.file.filename}`;
      db.prepare('UPDATE tutors SET intro_video_url = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(url, tutor.id);

      res.json({ success: true, data: { url } });
    });
  },

  /**
   * POST /api/teacher/upload-certificate
   */
  uploadCertificate(req, res, next) {
    certUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) return next(ApiError.badRequest(err.message));
        return next(ApiError.badRequest(err.message));
      }
      if (!req.file) return next(ApiError.badRequest('No file provided'));

      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user.id);
      if (!tutor) return next(ApiError.forbidden('Only teachers can upload certificates'));

      const title = req.body.title || 'Certificate';
      const url = `/uploads/certificates/${req.file.filename}`;
      const id = uuidv4();

      db.prepare('INSERT INTO teacher_certificates (id, tutor_id, title, file_url) VALUES (?, ?, ?, ?)')
        .run(id, tutor.id, title, url);

      res.status(201).json({ success: true, data: { id, title, url } });
    });
  },

  /**
   * GET /api/teacher/certificates
   */
  getCertificates(req, res, next) {
    try {
      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user.id);
      if (!tutor) return next(ApiError.forbidden('Only teachers have certificates'));

      const certs = db.prepare('SELECT id, title, file_url, created_at FROM teacher_certificates WHERE tutor_id = ? ORDER BY created_at DESC')
        .all(tutor.id);

      res.json({ success: true, data: certs });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/teacher/certificates/:id
   */
  deleteCertificate(req, res, next) {
    try {
      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user.id);
      if (!tutor) return next(ApiError.forbidden('Only teachers can manage certificates'));

      const cert = db.prepare('SELECT * FROM teacher_certificates WHERE id = ? AND tutor_id = ?')
        .get(req.params.id, tutor.id);
      if (!cert) return next(ApiError.notFound('Certificate not found'));

      // Delete file
      const filePath = path.join(uploadsDir, cert.file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      db.prepare('DELETE FROM teacher_certificates WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/teacher/tutor-profile
   * Update tutor bio, experience, video URL, accent, description, interests
   */
  updateTutorProfile(req, res, next) {
    try {
      const tutor = db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(req.user.id);
      if (!tutor) return next(ApiError.forbidden('Only teachers have tutor profiles'));

      const { bio, experienceYears, accent, description, interests, videoUrl } = req.body;
      const updates = [];
      const params = [];

      if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
      if (experienceYears !== undefined) { updates.push('experience_years = ?'); params.push(parseInt(experienceYears) || 0); }
      if (accent !== undefined) { updates.push('accent = ?'); params.push(accent); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (videoUrl !== undefined) { updates.push('intro_video_url = ?'); params.push(videoUrl); }
      if (interests) { updates.push('interests = ?'); params.push(JSON.stringify(interests)); }

      if (updates.length === 0) return next(ApiError.badRequest('No fields to update'));

      updates.push("updated_at = datetime('now')");
      params.push(tutor.id);

      db.prepare(`UPDATE tutors SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { uploadController, serveUploads };
