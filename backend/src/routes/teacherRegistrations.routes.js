const express = require('express');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { pool, query } = require('../config/db');

const router = express.Router();

const SELECT_TEACHER = `
  SELECT
    teachers.id,
    teachers.user_id,
    teachers.school_id,
    teachers.employee_number,
    teachers.specialization,
    teachers.speciality,
    teachers.diploma,
    teachers.hire_date,
    users.first_name,
    users.last_name,
    users.email,
    users.gender,
    users.birth_date,
    users.photo,
    users.blood_type,
    users.is_active,
    users.role,
    users.created_at
  FROM teachers
  INNER JOIN users ON users.id = teachers.user_id
`;

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

// GET all teachers
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const rows = await query(SELECT_TEACHER + ' WHERE teachers.school_id = ? ORDER BY teachers.id DESC', [schoolId]);
    res.json({ data: rows });
  })
);

// GET single teacher by id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const rows = await query(SELECT_TEACHER + ' WHERE teachers.id = ? AND teachers.school_id = ? LIMIT 1', [req.params.id, schoolId]);
    if (!rows.length) throw new HttpError(404, 'Teacher not found');
    res.json({ data: rows[0] });
  })
);

// POST — create teacher + user atomically (requires auth to resolve school_id)
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
      employee_number: employeeNumber,
      speciality = null,
      diploma = null,
      hire_date: hireDate = null,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !employeeNumber) {
      throw new HttpError(400, 'first_name, last_name, email, password, and employee_number are required');
    }

    // Resolve school for the logged-in admin
    const schoolId = await getSchoolId(req.auth.userId);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const hashedPassword = await bcrypt.hash(password, 10);

      const finalPhoto = (photo === null || photo === undefined) ? '' : photo;
      const [userResult] = await connection.execute(
        `INSERT INTO users (first_name, last_name, email, password, role, gender, birth_date, photo, blood_type)
         VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?)`,
        [firstName, lastName, email, hashedPassword, gender, birthDate, finalPhoto, bloodType]
      );
      const userId = userResult.insertId;

      await connection.execute(
        `INSERT INTO teachers (user_id, school_id, employee_number, speciality, diploma, hire_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, schoolId, employeeNumber, speciality, diploma, hireDate]
      );

      // Link user to school_users for permission/count queries
      if (schoolId) {
        try {
          await connection.execute(
            'INSERT INTO school_users (school_id, user_id) VALUES (?, ?)',
            [schoolId, userId]
          );
        } catch (e) { /* ignore duplicate */ }
      }

      await connection.commit();

      const rows = await query(SELECT_TEACHER + ' WHERE teachers.user_id = ? LIMIT 1', [userId]);
      res.status(201).json({ data: rows[0] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

// PUT — update teacher + user info by teacher id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const teacherId = req.params.id;

    const existing = await query('SELECT * FROM teachers WHERE id = ? LIMIT 1', [teacherId]);
    if (!existing.length) throw new HttpError(404, 'Teacher not found');
    const teacher = existing[0];

    const {
      first_name: firstName,
      last_name: lastName,
      email,
      gender,
      birth_date: birthDate,
      photo,
      employee_number: employeeNumber,
      speciality,
      diploma,
      hire_date: hireDate,
    } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

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
        userValues.push(teacher.user_id);
        await connection.execute(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userValues);
      }

      const tUpdates = [];
      const tValues = [];
      if (employeeNumber !== undefined) { tUpdates.push('employee_number = ?'); tValues.push(employeeNumber); }
      if (speciality !== undefined)     { tUpdates.push('speciality = ?');      tValues.push(speciality); }
      if (diploma !== undefined)        { tUpdates.push('diploma = ?');         tValues.push(diploma); }
      if (hireDate !== undefined)       { tUpdates.push('hire_date = ?');       tValues.push(hireDate); }

      if (tUpdates.length) {
        tValues.push(teacherId);
        await connection.execute(`UPDATE teachers SET ${tUpdates.join(', ')} WHERE id = ?`, tValues);
      }

      await connection.commit();

      const rows = await query(SELECT_TEACHER + ' WHERE teachers.id = ? LIMIT 1', [teacherId]);
      res.json({ data: rows[0] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

// DELETE — remove teacher + cascades to user
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const teacherId = req.params.id;
    const existing = await query('SELECT user_id FROM teachers WHERE id = ? LIMIT 1', [teacherId]);
    if (!existing.length) throw new HttpError(404, 'Teacher not found');

    await query('DELETE FROM users WHERE id = ?', [existing[0].user_id]);
    res.status(204).send();
  })
);

module.exports = router;
