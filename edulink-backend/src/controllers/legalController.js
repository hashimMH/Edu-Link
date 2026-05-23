const db = require('../config/database');
const ApiError = require('../utils/ApiError');

const legalController = {
  /**
   * GET /api/legal/:key
   * Public — returns privacy policy or terms
   */
  get(req, res, next) {
    try {
      const { key } = req.params;
      const page = db.prepare('SELECT * FROM legal_pages WHERE key = ?').get(key);
      if (!page) throw ApiError.notFound('Page not found');
      res.json({ success: true, data: page });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/legal
   * Public — returns both pages
   */
  list(req, res, next) {
    try {
      const pages = db.prepare('SELECT key, title, updated_at FROM legal_pages').all();
      res.json({ success: true, data: pages });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = legalController;
