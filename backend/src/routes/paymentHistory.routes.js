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

/** Compute next payment date from a base date + plan key */
function calcNextPaymentDate(baseDate, planKey) {
  if (!planKey) return null;
  const d = new Date(baseDate);
  if (isNaN(d.getTime())) return null;
  const months = planKey === '1_month' ? 1 : planKey === '3_months' ? 3 : planKey === '1_year' ? 12 : 0;
  if (!months) return null;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ─── GET  /student/:studentId  —  history for one student ────────────────────
router.get(
  '/student/:studentId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const { studentId } = req.params;

    const stuCheck = await query(
      'SELECT id FROM students WHERE id = ? AND school_id = ? LIMIT 1',
      [studentId, schoolId]
    );
    if (!stuCheck.length) throw new HttpError(404, 'Student not found');

    const rows = await query(
      `SELECT ph.*,
         u.first_name AS recorded_by_name, u.last_name AS recorded_by_last
       FROM payment_history ph
       LEFT JOIN users u ON u.id = ph.recorded_by_user_id
       WHERE ph.student_id = ?
       ORDER BY ph.payment_date DESC, ph.created_at DESC`,
      [studentId]
    );

    const total = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    res.json({ data: rows, total });
  })
);

// ─── POST  /student/:studentId  —  record a payment ─────────────────────────
router.post(
  '/student/:studentId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const { studentId } = req.params;
    const {
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod = 'cash',
      notes = null,
      update_status = true,
      subscription_plan: subscriptionPlan = null,
      promo_code: promoCode = null,
    } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new HttpError(400, 'Valid amount is required');
    }

    // Fetch student with formation
    const stuCheck = await query(
      `SELECT s.id, s.subscription_plan, s.enrollment_date, s.payment_status, s.formation_id,
              f.type AS formation_type, f.subscription_period
       FROM students s
       LEFT JOIN formations f ON f.id = s.formation_id
       WHERE s.id = ? AND s.school_id = ? LIMIT 1`,
      [studentId, schoolId]
    );
    if (!stuCheck.length) throw new HttpError(404, 'Student not found');
    const student = stuCheck[0];

    // Resolve promo discount
    let discountPercent = 0;
    let promoId = null;
    if (promoCode && student.formation_id) {
      const promoRows = await query(
        `SELECT id, discount_percent FROM promo_codes
         WHERE code = ? AND formation_id = ? AND is_active = 1 LIMIT 1`,
        [promoCode, student.formation_id]
      );
      if (promoRows.length) {
        discountPercent = Number(promoRows[0].discount_percent || 0);
        promoId = promoRows[0].id;
      }
    }

    // Determine effective plan
    const effectivePlan = subscriptionPlan || student.subscription_plan || null;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert payment record
      const [result] = await connection.execute(
        `INSERT INTO payment_history
           (student_id, school_id, amount, payment_date, payment_method,
            notes, recorded_by_user_id, subscription_plan, promo_code_id, discount_percent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          studentId,
          schoolId,
          Number(amount),
          paymentDate || new Date().toISOString().slice(0, 10),
          paymentMethod,
          notes,
          req.auth.userId,
          effectivePlan,
          promoId,
          discountPercent,
        ]
      );

      // Update student status
      if (update_status) {
        // Next payment date: from today if subscription, else null
        const baseDate = paymentDate || new Date().toISOString().slice(0, 10);
        const nextDate = calcNextPaymentDate(baseDate, effectivePlan);

        // If a specific plan was chosen, also update subscription_plan on student
        const planToSave = subscriptionPlan || null;

        const updateFields = [`payment_status = 'paid'`, `next_payment_date = ?`];
        const updateValues = [nextDate];
        if (planToSave) { updateFields.push('subscription_plan = ?'); updateValues.push(planToSave); }
        updateValues.push(studentId);

        await connection.execute(
          `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      await connection.commit();

      const [newRow] = await connection.execute(
        `SELECT ph.*, u.first_name AS recorded_by_name, u.last_name AS recorded_by_last
         FROM payment_history ph
         LEFT JOIN users u ON u.id = ph.recorded_by_user_id
         WHERE ph.id = ?`,
        [result.insertId]
      );

      res.status(201).json({ data: newRow[0] });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  })
);

// ─── DELETE  /:id  ───────────────────────────────────────────────────────────
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const existing = await query(
      'SELECT id FROM payment_history WHERE id = ? AND school_id = ? LIMIT 1',
      [req.params.id, schoolId]
    );
    if (!existing.length) throw new HttpError(404, 'Payment record not found');
    await query('DELETE FROM payment_history WHERE id = ?', [req.params.id]);
    res.status(204).send();
  })
);

// ─── GET  /  —  all school payments with optional filters ───────────────────
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const {
      student_id: studentId,
      date_start: dateStart,
      date_end: dateEnd,
      payment_method: paymentMethod,
    } = req.query;

    const conditions = ['ph.school_id = ?'];
    const values = [schoolId];

    if (studentId)     { conditions.push('ph.student_id = ?');    values.push(studentId); }
    if (paymentMethod) { conditions.push('ph.payment_method = ?'); values.push(paymentMethod); }
    if (dateStart && dateEnd) {
      conditions.push('ph.payment_date BETWEEN ? AND ?');
      values.push(dateStart, dateEnd);
    } else if (dateStart) {
      conditions.push('ph.payment_date >= ?'); values.push(dateStart);
    } else if (dateEnd) {
      conditions.push('ph.payment_date <= ?'); values.push(dateEnd);
    }

    const rows = await query(
      `SELECT ph.*,
         u.first_name, u.last_name, u.photo,
         st.registration_number,
         st.id AS student_id,
         f.title AS formation_title,
         pc.code AS promo_code_label,
         rec.first_name AS recorded_by_name, rec.last_name AS recorded_by_last
       FROM payment_history ph
       INNER JOIN students st  ON st.id  = ph.student_id
       INNER JOIN users u      ON u.id   = st.user_id
       LEFT  JOIN formations f ON f.id   = st.formation_id
       LEFT  JOIN promo_codes pc ON pc.id = ph.promo_code_id
       LEFT  JOIN users rec    ON rec.id = ph.recorded_by_user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ph.payment_date DESC, ph.created_at DESC`,
      values
    );

    const total = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    res.json({ data: rows, total });
  })
);

module.exports = router;
