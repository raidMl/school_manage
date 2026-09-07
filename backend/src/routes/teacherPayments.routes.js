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

// ─── GET /stats ─ overall statistics ─────────────────────────────────────────
router.get(
  '/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const curMonth = req.query.month ? parseInt(req.query.month) : (prev.getMonth() + 1);
    const curYear = req.query.year ? parseInt(req.query.year) : prev.getFullYear();

    // Total teachers with salary set
    const [teachersWithSalary] = await query(
      `SELECT COUNT(*) as cnt, COALESCE(SUM(monthly_salary),0) as total_mass
       FROM teachers WHERE school_id = ? AND monthly_salary IS NOT NULL`,
      [schoolId]
    );

    // Paid teachers this month
    const paidThisMonth = await query(
      `SELECT COUNT(*) as cnt, COALESCE(SUM(amount),0) as paid_amount
       FROM teacher_payments WHERE school_id = ? AND pay_month = ? AND pay_year = ?`,
      [schoolId, curMonth, curYear]
    );

    // YTD total
    const ytd = await query(
      `SELECT COALESCE(SUM(amount),0) as ytd FROM teacher_payments
       WHERE school_id = ? AND pay_year = ?`,
      [schoolId, curYear]
    );

    const totalTeachers = (teachersWithSalary.cnt || 0);
    const paidCount = (paidThisMonth[0].cnt || 0);

    res.json({
      total_teachers: totalTeachers,
      salary_mass: parseFloat(teachersWithSalary.total_mass || 0),
      paid_this_month: paidCount,
      unpaid_this_month: Math.max(0, totalTeachers - paidCount),
      paid_amount_this_month: parseFloat(paidThisMonth[0].paid_amount || 0),
      ytd_total: parseFloat(ytd[0].ytd || 0),
      current_month: curMonth,
      current_year: curYear
    });
  })
);

// ─── GET /summary/:year/:month ─ paid/unpaid status for a month ───────────────
router.get(
  '/summary/:year/:month',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const { year, month } = req.params;

    const teachers = await query(
      `SELECT t.id as teacher_id, u.first_name, u.last_name, u.photo, u.gender,
              t.employee_number, t.speciality, t.monthly_salary, t.ccp_rib, t.preferred_pay_method,
              tp.id as payment_id, tp.amount as paid_amount, tp.method as paid_method,
              tp.payment_date, tp.notes as paid_notes
       FROM teachers t
       INNER JOIN users u ON u.id = t.user_id
       LEFT JOIN teacher_payments tp ON tp.teacher_id = t.id
         AND tp.pay_month = ? AND tp.pay_year = ? AND tp.school_id = ?
       WHERE t.school_id = ? AND u.is_active = 1
       ORDER BY u.first_name ASC`,
      [month, year, schoolId, schoolId]
    );

    res.json({ data: teachers, month: parseInt(month), year: parseInt(year) });
  })
);

// ─── GET / ─ list all payment records ─────────────────────────────────────────
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const { year, month, teacher_id } = req.query;

    let sql = `
      SELECT tp.*, u.first_name, u.last_name, u.photo, u.gender,
             t.employee_number, t.speciality,
             ru.first_name as recorded_by_first, ru.last_name as recorded_by_last
      FROM teacher_payments tp
      INNER JOIN teachers t ON t.id = tp.teacher_id
      INNER JOIN users u ON u.id = t.user_id
      LEFT JOIN users ru ON ru.id = tp.recorded_by
      WHERE tp.school_id = ?
    `;
    const params = [schoolId];

    if (year)       { sql += ' AND tp.pay_year = ?';      params.push(year); }
    if (month)      { sql += ' AND tp.pay_month = ?';     params.push(month); }
    if (teacher_id) { sql += ' AND tp.teacher_id = ?';   params.push(teacher_id); }

    sql += ' ORDER BY tp.pay_year DESC, tp.pay_month DESC, u.first_name ASC';

    const rows = await query(sql, params);
    res.json({ data: rows });
  })
);

// ─── POST / ─ pay one or more teachers ────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const userId = req.auth.userId;
    // payments: [{ teacher_id, amount, method, notes }]
    const { payments, pay_month, pay_year, payment_date } = req.body;

    if (!payments || !payments.length) throw new HttpError(400, 'No payments provided');
    if (!pay_month || !pay_year || !payment_date) throw new HttpError(400, 'pay_month, pay_year, payment_date are required');

    const connection = await pool.getConnection();
    const results = [];
    try {
      await connection.beginTransaction();

      for (const p of payments) {
        const { teacher_id, amount, method = 'cash', notes = null } = p;
        if (!teacher_id || !amount || amount <= 0) continue;

        // Verify teacher belongs to school
        const [tc] = await connection.execute(
          'SELECT id FROM teachers WHERE id = ? AND school_id = ? LIMIT 1',
          [teacher_id, schoolId]
        );
        if (!tc) continue;

        // Get teacher name for treasury record
        const [tcInfo] = await connection.execute(
          `SELECT u.first_name, u.last_name FROM teachers t
           INNER JOIN users u ON u.id = t.user_id WHERE t.id = ? LIMIT 1`,
          [teacher_id]
        );

        // Insert treasury expense
        const [txResult] = await connection.execute(
          `INSERT INTO treasury_transactions
           (school_id, type, category, amount, transaction_date, notes, person_name, recorded_by)
           VALUES (?, 'expense', 'Teacher Salary', ?, ?, ?, ?, ?)`,
          [
            schoolId, amount, payment_date,
            `Salary ${pay_month}/${pay_year}` + (notes ? ' - ' + notes : ''),
            tcInfo ? `${tcInfo.first_name} ${tcInfo.last_name}` : `Teacher #${teacher_id}`,
            userId
          ]
        );
        const treasuryTxId = txResult.insertId;

        // Insert payment record (replace on duplicate = re-payment)
        const [pmResult] = await connection.execute(
          `INSERT INTO teacher_payments
           (school_id, teacher_id, amount, pay_month, pay_year, payment_date, method, notes, treasury_tx_id, recorded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             amount = VALUES(amount), payment_date = VALUES(payment_date),
             method = VALUES(method), notes = VALUES(notes),
             treasury_tx_id = VALUES(treasury_tx_id), recorded_by = VALUES(recorded_by)`,
          [schoolId, teacher_id, amount, pay_month, pay_year, payment_date, method, notes, treasuryTxId, userId]
        );

        results.push({ teacher_id, payment_id: pmResult.insertId || null, treasury_tx_id: treasuryTxId });
      }

      await connection.commit();
      res.status(201).json({ message: 'Payments recorded', results });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  })
);

// ─── PUT /:id ─ edit a payment record ────────────────────────────────────────
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const existing = await query(
      'SELECT * FROM teacher_payments WHERE id = ? AND school_id = ? LIMIT 1',
      [req.params.id, schoolId]
    );
    if (!existing.length) throw new HttpError(404, 'Payment not found');

    const { amount, method, payment_date, notes } = req.body;

    await pool.execute(
      `UPDATE teacher_payments SET amount = ?, method = ?, payment_date = ?, notes = ? WHERE id = ?`,
      [amount ?? existing[0].amount, method ?? existing[0].method,
       payment_date ?? existing[0].payment_date, notes ?? existing[0].notes, req.params.id]
    );

    // Also update the linked treasury transaction amount if it exists
    if (existing[0].treasury_tx_id && amount !== undefined) {
      await pool.execute(
        'UPDATE treasury_transactions SET amount = ? WHERE id = ?',
        [amount, existing[0].treasury_tx_id]
      );
    }

    res.json({ message: 'Payment updated' });
  })
);

// ─── DELETE /:id ─ delete a payment ───────────────────────────────────────────
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const existing = await query(
      'SELECT * FROM teacher_payments WHERE id = ? AND school_id = ? LIMIT 1',
      [req.params.id, schoolId]
    );
    if (!existing.length) throw new HttpError(404, 'Payment not found');

    // Delete linked treasury transaction
    if (existing[0].treasury_tx_id) {
      await pool.execute('DELETE FROM treasury_transactions WHERE id = ?', [existing[0].treasury_tx_id]);
    }

    await pool.execute('DELETE FROM teacher_payments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Payment deleted and treasury restored' });
  })
);

// ─── PUT /salary/:teacherId ─ save salary info ─────────────────────────────────
router.put(
  '/salary/:teacherId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const existing = await query(
      'SELECT id FROM teachers WHERE id = ? AND school_id = ? LIMIT 1',
      [req.params.teacherId, schoolId]
    );
    if (!existing.length) throw new HttpError(404, 'Teacher not found');

    const { monthly_salary, ccp_rib, preferred_pay_method } = req.body;

    await pool.execute(
      `UPDATE teachers SET monthly_salary = ?, ccp_rib = ?, preferred_pay_method = ? WHERE id = ?`,
      [monthly_salary ?? null, ccp_rib ?? null, preferred_pay_method ?? 'cash', req.params.teacherId]
    );

    res.json({ message: 'Salary info updated' });
  })
);

module.exports = router;
