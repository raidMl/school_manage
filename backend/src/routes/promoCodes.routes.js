const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { query } = require('../config/db');

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

const SELECT_PROMO_CODE = `
  SELECT
    pc.id,
    pc.formation_id,
    pc.code,
    pc.discount_percent,
    pc.type,
    pc.is_active,
    pc.created_at,
    pc.updated_at,
    f.title AS formation_title
  FROM promo_codes pc
  LEFT JOIN formations f ON f.id = pc.formation_id
`;

// GET all promo codes
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const where = ['f.school_id = ?'];
    const params = [schoolId];
    if (req.query.formation_id) {
      where.push('pc.formation_id = ?');
      params.push(req.query.formation_id);
    }
    const sql = SELECT_PROMO_CODE + ` WHERE ${where.join(' AND ')} ORDER BY pc.id DESC`;
    const rows = await query(sql, params);
    res.json({ data: rows });
  })
);

// POST create promo code
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      formation_id: formationId,
      code,
      discount_percent: discountPercent,
      type = 'many_students',
      is_active: isActive = true
    } = req.body;

    if (!formationId || !code || !discountPercent) {
      throw new HttpError(400, 'formation_id, code, and discount_percent are required');
    }

    if (discountPercent < 1 || discountPercent > 100) {
      throw new HttpError(400, 'discount_percent must be between 1 and 100');
    }

    const result = await query(
      `INSERT INTO promo_codes (formation_id, code, discount_percent, type, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [formationId, code, discountPercent, type, isActive]
    );

    const rows = await query(SELECT_PROMO_CODE + ' WHERE pc.id = ? LIMIT 1', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  })
);

// PUT update promo code
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const allowed = ['code', 'discount_percent', 'type', 'is_active'];
    const updates = [];
    const values = [];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (!updates.length) throw new HttpError(400, 'No valid fields provided');

    values.push(req.params.id);
    await query(`UPDATE promo_codes SET ${updates.join(', ')} WHERE id = ?`, values);

    const rows = await query(SELECT_PROMO_CODE + ' WHERE pc.id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) throw new HttpError(404, 'Promo code not found');
    res.json({ data: rows[0] });
  })
);

// DELETE promo code
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM promo_codes WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) throw new HttpError(404, 'Promo code not found');
    res.status(204).send();
  })
);

module.exports = router;
