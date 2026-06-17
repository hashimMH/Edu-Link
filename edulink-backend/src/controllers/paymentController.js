const pool = require('../config/database');

const paymentController = {
  /** GET /api/payments */
  async getAll(req, res, next) {
    try {
      const r = await pool.query(
        `SELECT id, type, amount, card_type, card_last_four, date, status
         FROM payments
         WHERE user_id = $1
         ORDER BY date DESC`,
        [req.user.id]
      );

      const formatted = r.rows.map((p) => ({
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

  /** GET /api/payments/summary */
  async getSummary(req, res, next) {
    try {
      const completedR = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE user_id = $1 AND status = 'completed'",
        [req.user.id]
      );
      const pendingR = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE user_id = $1 AND status = 'pending'",
        [req.user.id]
      );
      const latestR = await pool.query(
        `SELECT id, type, amount, card_type, card_last_four, date, status
         FROM payments WHERE user_id = $1 ORDER BY date DESC LIMIT 4`,
        [req.user.id]
      );

      res.json({
        success: true,
        data: {
          balance: parseFloat(completedR.rows[0].total),
          income: parseFloat(completedR.rows[0].total),
          pending: parseFloat(pendingR.rows[0].total),
          payments: latestR.rows.map((p) => ({
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
