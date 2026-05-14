const db = require('../config/database');

const paymentController = {
  /**
   * GET /api/payments
   * Get all payments for current user
   */
  getAll(req, res, next) {
    try {
      const payments = db.prepare(`
        SELECT id, type, amount, card_type, card_last_four, date, status
        FROM payments
        WHERE user_id = ?
        ORDER BY date DESC
      `).all(req.user.id);

      const formatted = payments.map((p) => ({
        id: p.id,
        type: p.type,
        amount: p.amount,
        cardType: p.card_type,
        cardNumber: '****' + (p.card_last_four || '****'),
        date: p.date,
        status: p.status,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/payments/summary
   * Get balance, income, pending
   */
  getSummary(req, res, next) {
    try {
      const completed = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments WHERE user_id = ? AND status = 'completed'
      `).get(req.user.id);

      const pending = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments WHERE user_id = ? AND status = 'pending'
      `).get(req.user.id);

      // Latest 4 payments for earnings screen
      const latest = db.prepare(`
        SELECT id, type, amount, card_type, card_last_four, date, status
        FROM payments
        WHERE user_id = ?
        ORDER BY date DESC LIMIT 4
      `).all(req.user.id);

      res.json({
        success: true,
        data: {
          balance: completed.total,
          income: completed.total,
          pending: pending.total,
          payments: latest.map((p) => ({
            id: p.id,
            type: p.type,
            amount: p.amount,
            cardType: p.card_type,
            cardNumber: '****' + (p.card_last_four || '****'),
            date: p.date,
            status: p.status,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = paymentController;
