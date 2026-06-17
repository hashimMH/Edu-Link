const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

const legalController = {
  /** GET /api/legal/:key */
  async get(req, res, next) {
    try {
      const { key } = req.params;
      const r = await pool.query('SELECT * FROM legal_pages WHERE key = $1', [key]);
      const page = r.rows[0];
      if (!page) throw ApiError.notFound('Page not found');
      res.json({ success: true, data: page });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/legal */
  async list(req, res, next) {
    try {
      const r = await pool.query('SELECT key, title, updated_at FROM legal_pages');
      res.json({ success: true, data: r.rows });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = legalController;
