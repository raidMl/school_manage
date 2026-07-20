const express = require('express');
const bcrypt = require('bcryptjs');
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

const SELECT_STUDENT = `
  SELECT
    students.id,
    students.user_id,
    students.formation_id,
    students.registration_number,
    students.parent_name,
    students.parent_phone,
    students.enrollment_date,
    students.payment_status,
    students.subscription_plan,
    students.next_payment_date,
    students.promo_code,
    students.discount_percent,
    users.first_name,
    users.last_name,
    users.email,
    users.gender,
    users.birth_date,
    users.photo,
    users.blood_type,
    users.is_active,
    users.role,
    users.created_at,
    f.title AS formation_title,
    f.type AS formation_type
  FROM students
  INNER JOIN users ON users.id = students.user_id
  LEFT JOIN formations f ON f.id = students.formation_id
`;

function computeNextPaymentDate(enrollmentDate, subscriptionPlan) {
  if (!enrollmentDate || !subscriptionPlan) return null;
  const date = new Date(enrollmentDate);
  if (Number.isNaN(date.getTime())) return null;
  let months = 0;
  if (subscriptionPlan === '1_month') months = 1;
  else if (subscriptionPlan === '3_months') months = 3;
  else if (subscriptionPlan === '1_year') months = 12;
  if (!months) return null;
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0,10);
}

// GET payment dashboard students
router.get(
  '/payments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const {
      formation_id: formationId,
      group_id: groupId,
      classroom_id: classroomId,
      teacher_id: teacherId,
      subscription_plan: subscriptionPlan,
      payment_due: paymentDue,
      payment_date_start: paymentDateStart,
      payment_date_end: paymentDateEnd,
    } = req.query;

    const conditions = ['students.school_id = ?'];
    const values = [schoolId];
    if (formationId) {
      conditions.push('students.formation_id = ?');
      values.push(formationId);
    }
    if (subscriptionPlan) {
      conditions.push('students.subscription_plan = ?');
      values.push(subscriptionPlan);
    }
    if (groupId) {
      conditions.push('sg.group_id = ?');
      values.push(groupId);
    }
    if (classroomId) {
      conditions.push('g.classroom_id = ?');
      values.push(classroomId);
    }
    if (teacherId) {
      conditions.push('(g.teacher_id = ? OR f.teacher_id = ?)');
      values.push(teacherId, teacherId);
    }
    if (paymentDue === 'week') {
      conditions.push('students.next_payment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)');
    } else if (paymentDue === 'tomorrow') {
      conditions.push('students.next_payment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)');
    } else if (paymentDue === 'overdue') {
      conditions.push('students.next_payment_date < CURDATE()');
    }
    if (paymentDateStart && paymentDateEnd) {
      conditions.push('students.next_payment_date BETWEEN ? AND ?');
      values.push(paymentDateStart, paymentDateEnd);
    } else if (paymentDateStart) {
      conditions.push('students.next_payment_date >= ?');
      values.push(paymentDateStart);
    } else if (paymentDateEnd) {
      conditions.push('students.next_payment_date <= ?');
      values.push(paymentDateEnd);
    }

    const whereSql = conditions.join(' AND ');

    const summaryRows = await query(
      `SELECT
        COUNT(DISTINCT students.id) AS student_count,
        COALESCE(SUM(
          CASE students.subscription_plan
            WHEN '1_month' THEN COALESCE(f.price_monthly, f.price)
            WHEN '3_months' THEN COALESCE(f.price_3_months, f.price)
            WHEN '1_year' THEN COALESCE(f.price_1_year, f.price)
            ELSE f.price
          END * (1 - COALESCE(students.discount_percent, 0) / 100)
        ), 0) AS total_revenue
      FROM students
      LEFT JOIN formations f ON f.id = students.formation_id
      LEFT JOIN student_groups sg ON sg.student_id = students.id
      LEFT JOIN \`groups\` g ON g.id = sg.group_id
      WHERE ${whereSql}`,
      values
    );

    const rows = await query(
      `SELECT
        students.id,
        students.user_id,
        students.formation_id,
        students.registration_number,
        students.parent_name,
        students.parent_phone,
        students.enrollment_date,
        students.payment_status,
        students.subscription_plan,
        students.next_payment_date,
        students.promo_code,
        students.discount_percent,
        users.first_name,
        users.last_name,
        users.email,
        users.gender,
        users.birth_date,
        users.photo,
        f.title AS formation_title,
        f.type AS formation_type,
        COALESCE(GROUP_CONCAT(DISTINCT g.name SEPARATOR ', '), '') AS group_names,
        COALESCE(GROUP_CONCAT(DISTINCT c.name SEPARATOR ', '), '') AS classroom_names
      FROM students
      INNER JOIN users ON users.id = students.user_id
      LEFT JOIN formations f ON f.id = students.formation_id
      LEFT JOIN student_groups sg ON sg.student_id = students.id
      LEFT JOIN \`groups\` g ON g.id = sg.group_id
      LEFT JOIN classrooms c ON c.id = g.classroom_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY students.id
      ORDER BY students.id DESC`,
      values
    );

    res.json({ data: rows, summary: summaryRows[0] || { total_revenue: 0, student_count: 0 } });
  })
);

// GET all students
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const rows = await query(SELECT_STUDENT + ' WHERE students.school_id = ? ORDER BY students.id DESC', [schoolId]);
    res.json({ data: rows });
  })
);

// GET single student by id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const rows = await query(SELECT_STUDENT + ' WHERE students.id = ? AND students.school_id = ? LIMIT 1', [req.params.id, schoolId]);
    if (!rows.length) throw new HttpError(404, 'Student not found');
    res.json({ data: rows[0] });
  })
);

// POST — create student + user atomically (requires auth to resolve school_id)
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      gender = null,
      birth_date: birthDate = null,
      photo = null,
      blood_type: bloodType = null,
      formation_id: formationId,
      registration_number: registrationNumber,
      parent_name: parentName = null,
      parent_phone: parentPhone = null,
      enrollment_date: enrollmentDate = null,
      payment_status: paymentStatus = 'not_paid',
      subscription_plan: subscriptionPlan = null,
      promo_code: promoCode = null,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !registrationNumber || !formationId) {
      throw new HttpError(400, 'first_name, last_name, email, password, formation_id, and registration_number are required');
    }

    // Resolve school for the logged-in admin
    const schoolId = await getSchoolId(req.auth.userId);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let appliedDiscountPercent = 0;
      let appliedPromoCode = null;
      if (promoCode) {
        const [promoRows] = await connection.execute(
          `SELECT discount_percent FROM promo_codes WHERE code = ? AND is_active = 1 AND formation_id = ? LIMIT 1`,
          [promoCode, formationId]
        );
        if (!promoRows.length) {
          throw new HttpError(400, 'Promo code is invalid for this formation');
        }
        appliedDiscountPercent = Number(promoRows[0].discount_percent || 0);
        appliedPromoCode = promoCode;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const finalPhoto = (photo === null || photo === undefined) ? '' : photo;
      const [userResult] = await connection.execute(
        `INSERT INTO users (first_name, last_name, email, password, role, gender, birth_date, photo, blood_type)
         VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?)`,
        [firstName, lastName, email, hashedPassword, gender, birthDate, finalPhoto, bloodType]
      );
      const userId = userResult.insertId;

      await connection.execute(
        `INSERT INTO students (user_id, school_id, formation_id, registration_number, parent_name, parent_phone, enrollment_date, payment_status, subscription_plan, next_payment_date, promo_code, discount_percent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, schoolId, formationId, registrationNumber, parentName, parentPhone, enrollmentDate, paymentStatus, subscriptionPlan, computeNextPaymentDate(enrollmentDate, subscriptionPlan, paymentStatus), appliedPromoCode, appliedDiscountPercent]
      );

      await connection.commit();

      const rows = await query(SELECT_STUDENT + ' WHERE students.user_id = ? LIMIT 1', [userId]);
      res.status(201).json({ data: rows[0] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

// PUT — update student + user info by student id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const studentId = req.params.id;

    const existing = await query('SELECT * FROM students WHERE id = ? LIMIT 1', [studentId]);
    if (!existing.length) throw new HttpError(404, 'Student not found');
    const student = existing[0];

    const {
      first_name: firstName,
      last_name: lastName,
      email,
      gender,
      birth_date: birthDate,
      photo,
      formation_id: formationId,
      registration_number: registrationNumber,
      parent_name: parentName,
      parent_phone: parentPhone,
      enrollment_date: enrollmentDate,
      payment_status: paymentStatus,
      subscription_plan: subscriptionPlan,
      promo_code: promoCode,
    } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let targetFormationId = student.formation_id;
      if (formationId !== undefined) {
        targetFormationId = formationId;
      }

      let appliedDiscountPercent = student.discount_percent || 0;
      let appliedPromoCode = student.promo_code || null;
      if (promoCode !== undefined) {
        if (promoCode === null || promoCode === '') {
          appliedPromoCode = null;
          appliedDiscountPercent = 0;
        } else {
          const [promoRows] = await connection.execute(
            `SELECT discount_percent FROM promo_codes WHERE code = ? AND is_active = 1 AND formation_id = ? LIMIT 1`,
            [promoCode, targetFormationId]
          );
          if (!promoRows.length) {
            throw new HttpError(400, 'Promo code is invalid for this formation');
          }
          appliedPromoCode = promoCode;
          appliedDiscountPercent = Number(promoRows[0].discount_percent || 0);
        }
      }

      // Update user fields if provided
      const userUpdates = [];
      const userValues = [];
      if (firstName !== undefined) { userUpdates.push('first_name = ?'); userValues.push(firstName); }
      if (lastName !== undefined)  { userUpdates.push('last_name = ?');  userValues.push(lastName); }
      if (email !== undefined)     { userUpdates.push('email = ?');      userValues.push(email); }
      if (gender !== undefined)    { userUpdates.push('gender = ?');     userValues.push(gender); }
      if (birthDate !== undefined) { userUpdates.push('birth_date = ?'); userValues.push(birthDate); }
      if (photo !== undefined)     { userUpdates.push('photo = ?');      userValues.push(photo); }
      if (req.body.blood_type !== undefined) { userUpdates.push('blood_type = ?'); userValues.push(req.body.blood_type || null); }
      if (req.body.is_active !== undefined) { userUpdates.push('is_active = ?'); userValues.push(req.body.is_active ? 1 : 0); }

      if (userUpdates.length) {
        userValues.push(student.user_id);
        await connection.execute(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userValues);
      }

      // Update student fields if provided
      const stuUpdates = [];
      const stuValues = [];
      if (formationId !== undefined)        { stuUpdates.push('formation_id = ?');        stuValues.push(formationId); }
      if (registrationNumber !== undefined) { stuUpdates.push('registration_number = ?'); stuValues.push(registrationNumber); }
      if (parentName !== undefined)         { stuUpdates.push('parent_name = ?');         stuValues.push(parentName); }
      if (parentPhone !== undefined)        { stuUpdates.push('parent_phone = ?');        stuValues.push(parentPhone); }
      if (enrollmentDate !== undefined)     { stuUpdates.push('enrollment_date = ?');     stuValues.push(enrollmentDate); }
      if (paymentStatus !== undefined)      { stuUpdates.push('payment_status = ?');      stuValues.push(paymentStatus); }
      if (subscriptionPlan !== undefined)  {
        stuUpdates.push('subscription_plan = ?');
        stuValues.push(subscriptionPlan === '' ? null : subscriptionPlan);
      }
      if (promoCode !== undefined) {
        stuUpdates.push('promo_code = ?');
        stuValues.push(appliedPromoCode);
        stuUpdates.push('discount_percent = ?');
        stuValues.push(appliedDiscountPercent);
      }
      const targetEnrollmentDate = enrollmentDate !== undefined ? enrollmentDate : student.enrollment_date;
      const targetSubscriptionPlan = subscriptionPlan !== undefined ? (subscriptionPlan === '' ? null : subscriptionPlan) : student.subscription_plan;
      const targetPaymentStatus = paymentStatus !== undefined ? paymentStatus : student.payment_status;
      if (paymentStatus !== undefined || subscriptionPlan !== undefined || enrollmentDate !== undefined) {
        stuUpdates.push('next_payment_date = ?');
        stuValues.push(computeNextPaymentDate(targetEnrollmentDate, targetSubscriptionPlan, targetPaymentStatus));
      }

      if (stuUpdates.length) {
        stuValues.push(studentId);
        await connection.execute(`UPDATE students SET ${stuUpdates.join(', ')} WHERE id = ?`, stuValues);
      }

      await connection.commit();

      const rows = await query(SELECT_STUDENT + ' WHERE students.id = ? LIMIT 1', [studentId]);
      res.json({ data: rows[0] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

// DELETE — remove student + cascades to user
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const existing = await query('SELECT user_id FROM students WHERE id = ? LIMIT 1', [studentId]);
    if (!existing.length) throw new HttpError(404, 'Student not found');

    // Deleting the user cascades to student (FK ON DELETE CASCADE)
    await query('DELETE FROM users WHERE id = ?', [existing[0].user_id]);
    res.status(204).send();
  })
);

module.exports = router;