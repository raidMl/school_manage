const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { pool, query } = require('../config/db');

const router = express.Router();

async function getSchoolId(userId) {
  const rows = await query(
    `SELECT s.id FROM schools s
     LEFT JOIN school_users su ON su.school_id = s.id
     WHERE s.admin_id = ? OR su.user_id = ?
     ORDER BY s.created_at DESC LIMIT 1`,
    [userId, userId]
  );
  return rows[0] ? rows[0].id : null;
}

// ─── GET /  — list transactions + summary ─────────────────────────────────────
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const { date_start, date_end, type } = req.query;

    let sql = `
      SELECT * FROM (
        SELECT 
          t.id, 
          'treasury' as source_table,
          t.type, 
          t.category, 
          t.amount, 
          t.transaction_date, 
          t.notes, 
          t.recorded_by,
          u.first_name as recorded_by_name, 
          u.last_name as recorded_by_last
        FROM treasury_transactions t
        LEFT JOIN users u ON t.recorded_by = u.id
        WHERE t.school_id = ?
        
        UNION ALL
        
        SELECT 
          p.id, 
          'payment' as source_table,
          'income' as type, 
          'Student Payment' as category, 
          p.amount, 
          p.payment_date as transaction_date, 
          p.notes, 
          p.recorded_by_user_id as recorded_by,
          u.first_name as recorded_by_name, 
          u.last_name as recorded_by_last
        FROM payment_history p
        LEFT JOIN users u ON p.recorded_by_user_id = u.id
        WHERE p.school_id = ?
      ) as combined
      WHERE 1=1
    `;
    const params = [schoolId, schoolId];

    if (date_start) { sql += ' AND transaction_date >= ?'; params.push(date_start); }
    if (date_end)   { sql += ' AND transaction_date <= ?'; params.push(date_end); }
    if (type)       { sql += ' AND type = ?';              params.push(type); }

    sql += ' ORDER BY transaction_date DESC, id DESC';

    const transactions = await query(sql, params);

    let total_income = 0;
    let total_expense = 0;
    transactions.forEach(function (t) {
      if (t.type === 'income')  total_income  += parseFloat(t.amount);
      if (t.type === 'expense') total_expense += parseFloat(t.amount);
    });

    res.json({
      data: transactions,
      summary: {
        total_income:  total_income,
        total_expense: total_expense,
        balance:       total_income - total_expense
      }
    });
  })
);

// ─── POST /  — add transaction ────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const userId = req.auth.userId;
    const { type, category, amount, transaction_date, notes } = req.body;

    if (!type || (type !== 'income' && type !== 'expense'))
      throw new HttpError(400, 'Valid type (income/expense) is required');
    if (!amount || isNaN(amount) || amount <= 0)
      throw new HttpError(400, 'Valid positive amount is required');
    if (!transaction_date)
      throw new HttpError(400, 'Transaction date is required');

    const [result] = await pool.execute(
      `INSERT INTO treasury_transactions
       (school_id, type, category, amount, transaction_date, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, type, category || null, amount, transaction_date, notes || null, userId]
    );

    res.status(201).json({
      message: 'Transaction added successfully',
      transactionId: result.insertId
    });
  })
);

// ─── DELETE /:id  — remove transaction ────────────────────────────────────────
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const tx = await query(
      'SELECT id FROM treasury_transactions WHERE id = ? AND school_id = ? LIMIT 1',
      [req.params.id, schoolId]
    );
    if (!tx.length) throw new HttpError(404, 'Transaction not found');

    await pool.execute('DELETE FROM treasury_transactions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Transaction deleted successfully' });
  })
);

module.exports = router;
