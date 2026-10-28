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
         u.first_name AS recorded_by_name, u.last_name AS recorded_by_last,
         g.name AS group_name,
         COALESCE(f.title, f_direct.title) AS formation_title
       FROM payment_history ph
       LEFT JOIN users u ON u.id = ph.recorded_by_user_id
       LEFT JOIN \`groups\` g ON g.id = ph.group_id
       LEFT JOIN formations f ON f.id = g.formation_id
       LEFT JOIN formations f_direct ON f_direct.id = ph.formation_id
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
      group_id: groupId = null,
      formation_id: formationId = null,
    } = req.body;

    if (amount === undefined || amount === null || amount === '' || isNaN(Number(amount)) || Number(amount) < 0) {
      throw new HttpError(400, 'Valid non-negative amount is required');
    }

    let finalNotes = notes;
    if (Number(amount) === 0 && (!finalNotes || !String(finalNotes).trim())) {
      finalNotes = 'معفى من الدفع.';
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

    // Resolve target formation id if group_id is given
    let targetFormationId = formationId;
    if (groupId && !targetFormationId) {
      const gRow = await query('SELECT formation_id FROM `groups` WHERE id = ?', [groupId]);
      if (gRow.length && gRow[0].formation_id) targetFormationId = gRow[0].formation_id;
    }
    if (!targetFormationId) targetFormationId = student.formation_id || null;

    // Resolve promo discount
    let discountPercent = 0;
    let promoId = null;
    if (promoCode) {
      const codeClean = String(promoCode).trim();
      let promoRows = [];
      if (targetFormationId) {
        promoRows = await query(
          `SELECT pc.id, pc.discount_percent FROM promo_codes pc
           WHERE pc.code = ? AND pc.formation_id = ? AND pc.is_active = 1 LIMIT 1`,
          [codeClean, targetFormationId]
        );
      }
      if (!promoRows.length) {
        promoRows = await query(
          `SELECT pc.id, pc.discount_percent FROM promo_codes pc
           INNER JOIN formations f ON f.id = pc.formation_id
           WHERE pc.code = ? AND f.school_id = ? AND pc.is_active = 1 LIMIT 1`,
          [codeClean, schoolId]
        );
      }
      if (promoRows.length) {
        discountPercent = Number(promoRows[0].discount_percent || 0);
        promoId = promoRows[0].id;
      }

      // Ensure promo code is included inside notes
      if (!finalNotes || !finalNotes.includes(codeClean)) {
        const promoTag = `كود الخصم: ${codeClean}${discountPercent > 0 ? ` (خصم ${discountPercent}%)` : ''}`;
        finalNotes = finalNotes ? `${finalNotes} - ${promoTag}` : promoTag;
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
           (student_id, group_id, formation_id, school_id, amount, payment_date, payment_method,
            notes, recorded_by_user_id, subscription_plan, promo_code_id, discount_percent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          studentId,
          groupId ? Number(groupId) : null,
          targetFormationId ? Number(targetFormationId) : null,
          schoolId,
          Number(amount),
          paymentDate || new Date().toISOString().slice(0, 10),
          paymentMethod,
          finalNotes,
          req.auth.userId,
          effectivePlan,
          promoId,
          discountPercent,
        ]
      );

      // Update student status
      if (update_status) {
        const baseDate = paymentDate || new Date().toISOString().slice(0, 10);
        const nextDate = calcNextPaymentDate(baseDate, effectivePlan);

        // Update student_groups if group_id is specified
        if (groupId) {
          await connection.execute(
            `UPDATE student_groups
             SET payment_status = 'paid',
                 subscription_plan = COALESCE(?, subscription_plan),
                 next_payment_date = ?,
                 last_payment_date = ?
             WHERE student_id = ? AND group_id = ?`,
            [subscriptionPlan || null, nextDate, baseDate, studentId, groupId]
          );
        } else {
          // If no group_id specified, check how many groups the student belongs to
          const [stGroups] = await connection.execute(
            'SELECT id, group_id FROM student_groups WHERE student_id = ?',
            [studentId]
          );
          if (stGroups.length === 1) {
            await connection.execute(
              `UPDATE student_groups
               SET payment_status = 'paid',
                   subscription_plan = COALESCE(?, subscription_plan),
                   next_payment_date = ?,
                   last_payment_date = ?
               WHERE student_id = ?`,
              [subscriptionPlan || null, nextDate, baseDate, studentId]
            );
          } else if (stGroups.length > 1) {
            // Mark the first unpaid group as paid
            const [firstUnpaid] = await connection.execute(
              `SELECT group_id FROM student_groups WHERE student_id = ? AND payment_status IN ('not_paid', 'unpaid') LIMIT 1`,
              [studentId]
            );
            if (firstUnpaid.length > 0) {
              await connection.execute(
                `UPDATE student_groups
                 SET payment_status = 'paid',
                     subscription_plan = COALESCE(?, subscription_plan),
                     next_payment_date = ?,
                     last_payment_date = ?
                 WHERE student_id = ? AND group_id = ?`,
                [subscriptionPlan || null, nextDate, baseDate, studentId, firstUnpaid[0].group_id]
              );
            }
          }
        }

        // Calculate and synchronize student overall payment_status & next_payment_date
        const [allGroups] = await connection.execute(
          'SELECT payment_status, next_payment_date FROM student_groups WHERE student_id = ?',
          [studentId]
        );

        let overallStatus = 'paid';
        let overallNextDate = nextDate;

        if (allGroups.length > 0) {
          const allPaid = allGroups.every(g => g.payment_status === 'paid');
          const somePaid = allGroups.some(g => g.payment_status === 'paid');
          overallStatus = allPaid ? 'paid' : (somePaid ? 'partial' : 'not_paid');

          const dates = allGroups.map(g => g.next_payment_date).filter(Boolean).sort();
          overallNextDate = dates[0] || null;
        }

        const updateFields = [`payment_status = ?`, `next_payment_date = ?`];
        const updateValues = [overallStatus, overallNextDate];
        if (subscriptionPlan) {
          updateFields.push('subscription_plan = ?');
          updateValues.push(subscriptionPlan);
        }
        updateValues.push(studentId);

        await connection.execute(
          `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      await connection.commit();

      const [newRow] = await connection.execute(
        `SELECT ph.*, u.first_name AS recorded_by_name, u.last_name AS recorded_by_last,
                g.name AS group_name,
                COALESCE(f.title, f_direct.title) AS formation_title
         FROM payment_history ph
         LEFT JOIN users u ON u.id = ph.recorded_by_user_id
         LEFT JOIN \`groups\` g ON g.id = ph.group_id
         LEFT JOIN formations f ON f.id = g.formation_id
         LEFT JOIN formations f_direct ON f_direct.id = ph.formation_id
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

// ─── PUT  /:id  —  update payment record ────────────────────────────────────
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const existing = await query(
      'SELECT id, student_id FROM payment_history WHERE id = ? AND school_id = ? LIMIT 1',
      [req.params.id, schoolId]
    );
    if (!existing.length) throw new HttpError(404, 'Payment record not found');

    const {
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod = 'cash',
      notes = null,
    } = req.body;

    if (amount === undefined || amount === null || amount === '' || isNaN(Number(amount)) || Number(amount) < 0) {
      throw new HttpError(400, 'Valid non-negative amount is required');
    }
    if (!paymentDate) {
      throw new HttpError(400, 'Payment date is required');
    }

    let finalNotes = notes;
    if (Number(amount) === 0 && (!finalNotes || !String(finalNotes).trim())) {
      finalNotes = 'معفى من الدفع.';
    }

    await pool.execute(
      `UPDATE payment_history
       SET amount = ?, payment_date = ?, payment_method = ?, notes = ?
       WHERE id = ? AND school_id = ?`,
      [Number(amount), paymentDate, paymentMethod, finalNotes || null, req.params.id, schoolId]
    );

    const updated = await query(
      `SELECT ph.*,
         u.first_name, u.last_name, u.photo, u.gender,
         st.registration_number,
         st.id AS student_id,
         f.title AS formation_title,
         rec.first_name AS recorded_by_name, rec.last_name AS recorded_by_last
       FROM payment_history ph
       INNER JOIN students st  ON st.id  = ph.student_id
       INNER JOIN users u      ON u.id   = st.user_id
       LEFT  JOIN formations f ON f.id   = st.formation_id
       LEFT  JOIN users rec    ON rec.id = ph.recorded_by_user_id
       WHERE ph.id = ? LIMIT 1`,
      [req.params.id]
    );

    res.json({ message: 'Payment updated successfully', data: updated[0] });
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
         u.first_name, u.last_name, u.photo, u.gender,
         st.registration_number,
         st.id AS student_id,
         g.name AS group_name,
         COALESCE(ph_f.title, g_f.title, f.title) AS formation_title,
         pc.code AS promo_code_label,
         rec.first_name AS recorded_by_name, rec.last_name AS recorded_by_last
       FROM payment_history ph
       INNER JOIN students st  ON st.id  = ph.student_id
       INNER JOIN users u      ON u.id   = st.user_id
       LEFT  JOIN \`groups\` g  ON g.id   = ph.group_id
       LEFT  JOIN formations g_f ON g_f.id = g.formation_id
       LEFT  JOIN formations ph_f ON ph_f.id = ph.formation_id
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

// ─── PUT  /student/:studentId/group/:groupId  —  update group status directly ──
router.put(
  '/student/:studentId/group/:groupId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const { studentId, groupId } = req.params;
    const { payment_status, subscription_plan, next_payment_date } = req.body;

    const stuCheck = await query(
      'SELECT id FROM students WHERE id = ? AND school_id = ? LIMIT 1',
      [studentId, schoolId]
    );
    if (!stuCheck.length) throw new HttpError(404, 'Student not found');

    const updates = [];
    const params = [];
    if (payment_status !== undefined) { updates.push('payment_status = ?'); params.push(payment_status); }
    if (subscription_plan !== undefined) { updates.push('subscription_plan = ?'); params.push(subscription_plan); }
    if (next_payment_date !== undefined) { updates.push('next_payment_date = ?'); params.push(next_payment_date || null); }

    if (updates.length > 0) {
      params.push(studentId, groupId);
      await query(`UPDATE student_groups SET ${updates.join(', ')} WHERE student_id = ? AND group_id = ?`, params);
    }

    // Sync overall student status
    const allGroups = await query('SELECT payment_status, next_payment_date FROM student_groups WHERE student_id = ?', [studentId]);
    if (allGroups.length > 0) {
      const allPaid = allGroups.every(g => g.payment_status === 'paid');
      const somePaid = allGroups.some(g => g.payment_status === 'paid');
      const overallStatus = allPaid ? 'paid' : (somePaid ? 'partial' : 'not_paid');
      const dates = allGroups.map(g => g.next_payment_date).filter(Boolean).sort();
      const overallNextDate = dates[0] || null;
      await query('UPDATE students SET payment_status = ?, next_payment_date = ? WHERE id = ?', [overallStatus, overallNextDate, studentId]);
    }

    res.json({ success: true, message: 'Group payment status updated successfully' });
  })
);

module.exports = router;
