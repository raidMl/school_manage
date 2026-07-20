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

const SELECT_FORMATION = `
  SELECT
    f.id,
    f.school_id,
    f.teacher_id,
    f.classroom_id,
    f.title,
    f.description,
    f.image,
    f.duration_hours,
    f.price,
    f.price_monthly,
    f.price_3_months,
    f.price_1_year,
    f.type,
    f.subscription_period,
    f.start_date,
    f.end_date,
    f.status,
    f.created_at,
    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
    c.name AS classroom_name
  FROM formations f
  LEFT JOIN teachers t ON t.id = f.teacher_id
  LEFT JOIN users u ON u.id = t.user_id
  LEFT JOIN classrooms c ON c.id = f.classroom_id
`;

// GET all formations
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const sql = SELECT_FORMATION + ' WHERE f.school_id = ? ORDER BY f.id DESC';
    const rows = await query(sql, [schoolId]);
    res.json({ data: rows });
  })
);

// GET single formation
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const rows = await query(SELECT_FORMATION + ' WHERE f.id = ? AND f.school_id = ? LIMIT 1', [req.params.id, schoolId]);
    if (!rows.length) throw new HttpError(404, 'Formation not found');
    res.json({ data: rows[0] });
  })
);

// POST — create formation
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      school_id: schoolId,
      teacher_id: teacherId = null,
      classroom_id: classroomId = null,
      title,
      description = null,
      image = null,
      duration_hours: durationHours = null,
      price = 0,
      price_monthly: priceMonthly = null,
      price_3_months: price3Months = null,
      price_1_year: price1Year = null,
      type = 'formation',
      status = 'open',
      subscription_period: subscriptionPeriod = null,
      start_date: startDate = null,
      end_date: endDate = null,
    } = req.body;

    if (!schoolId || !title) {
      throw new HttpError(400, 'school_id and title are required');
    }

    const normalizedTeacherId = teacherId === '' || teacherId === undefined ? null : teacherId;
    const normalizedClassroomId = classroomId === '' || classroomId === undefined ? null : classroomId;
    const effectivePrice = type === 'subscription'
      ? (subscriptionPeriod === '1_month' ? priceMonthly : (subscriptionPeriod === '3_months' ? price3Months : (subscriptionPeriod === '1_year' ? price1Year : price)))
      : price;

    const result = await query(
      `INSERT INTO formations (school_id, teacher_id, classroom_id, title, description, image, duration_hours, price, price_monthly, price_3_months, price_1_year, type, subscription_period, status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, normalizedTeacherId, normalizedClassroomId, title, description, image, durationHours, effectivePrice, priceMonthly, price3Months, price1Year, type, subscriptionPeriod, status || 'open', startDate, endDate]
    );

    const rows = await query(SELECT_FORMATION + ' WHERE f.id = ? LIMIT 1', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  })
);

// PUT — update formation
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const allowed = ['teacher_id', 'classroom_id', 'title', 'description', 'image', 'duration_hours', 'price', 'price_monthly', 'price_3_months', 'price_1_year', 'type', 'subscription_period', 'status', 'start_date', 'end_date'];
    const updates = [];
    const values = [];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        const value = field === 'teacher_id' || field === 'classroom_id'
          ? (req.body[field] === '' ? null : req.body[field])
          : req.body[field];
        updates.push(`${field} = ?`);
        values.push(value);
      }
    });

    if (!updates.length) throw new HttpError(400, 'No valid fields provided');

    values.push(req.params.id);
    await query(`UPDATE formations SET ${updates.join(', ')} WHERE id = ?`, values);

    const rows = await query(SELECT_FORMATION + ' WHERE f.id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) throw new HttpError(404, 'Formation not found');
    res.json({ data: rows[0] });
  })
);

// DELETE — remove formation
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM formations WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) throw new HttpError(404, 'Formation not found');
    res.status(204).send();
  })
);

module.exports = router;