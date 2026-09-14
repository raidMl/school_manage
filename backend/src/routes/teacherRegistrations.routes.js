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
    COALESCE(teachers.phone, users.phone) AS phone,
    teachers.specialization,
    teachers.speciality,
    teachers.diploma,
    teachers.national_id,
    teachers.social_security_number,
    teachers.hire_date,
    teachers.monthly_salary,
    teachers.ccp_rib,
    teachers.preferred_pay_method,
    teachers.rfid_tag,
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

// GET check if a student/teacher/user with the same first name and last name already exists in the school
router.get(
  '/check-duplicate-name',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    const firstName = (req.query.first_name || '').trim();
    const lastName = (req.query.last_name || '').trim();

    if (!firstName || !lastName) {
      return res.json({ exists: false, count: 0, matches: [] });
    }

    let sql = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
             s.id AS student_id, t.id AS teacher_id
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN teachers t ON t.user_id = u.id
      WHERE LOWER(TRIM(u.first_name)) = LOWER(?)
        AND LOWER(TRIM(u.last_name)) = LOWER(?)
    `;
    const params = [firstName, lastName];
    if (schoolId) {
      sql += ` AND (s.school_id = ? OR t.school_id = ? OR (s.school_id IS NULL AND t.school_id IS NULL))`;
      params.push(schoolId, schoolId);
    }
    sql += ` ORDER BY u.id DESC LIMIT 10`;

    const matches = await query(sql, params);
    res.json({
      exists: matches.length > 0,
      count: matches.length,
      matches
    });
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
      phone = null,
      password,
      gender = null,
      birth_date: birthDate = null,
      photo = null,
      blood_type: bloodType = null,
      employee_number: employeeNumber,
      speciality = null,
      diploma = null,
      national_id: nationalId = null,
      social_security_number: socialSecurityNumber = null,
      hire_date: hireDate = null,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !employeeNumber) {
      throw new HttpError(400, 'first_name, last_name, email, password, and employee_number are required');
    }

    // Resolve school for the logged-in admin
    const schoolId = await getSchoolId(req.auth.userId);

    // Check if any student/teacher/user with the same first name and last name exists
    let dupSql = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN teachers t ON t.user_id = u.id
      WHERE LOWER(TRIM(u.first_name)) = LOWER(?)
        AND LOWER(TRIM(u.last_name)) = LOWER(?)
    `;
    const dupParams = [firstName.trim(), lastName.trim()];
    if (schoolId) {
      dupSql += ` AND (s.school_id = ? OR t.school_id = ? OR (s.school_id IS NULL AND t.school_id IS NULL))`;
      dupParams.push(schoolId, schoolId);
    }
    const duplicateMatches = await query(dupSql, dupParams);
    const hasDuplicate = duplicateMatches.length > 0;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const hashedPassword = await bcrypt.hash(password, 10);

      const finalPhoto = (photo === null || photo === undefined) ? '' : photo;
      const [userResult] = await connection.execute(
        `INSERT INTO users (first_name, last_name, email, phone, password, role, gender, birth_date, photo, blood_type)
         VALUES (?, ?, ?, ?, ?, 'teacher', ?, ?, ?, ?)`,
        [firstName, lastName, email, phone || null, hashedPassword, gender, birthDate, finalPhoto, bloodType]
      );
      const userId = userResult.insertId;

      await connection.execute(
        `INSERT INTO teachers (user_id, school_id, employee_number, phone, speciality, diploma, national_id, social_security_number, hire_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, schoolId, employeeNumber, phone || null, speciality, diploma, nationalId, socialSecurityNumber, hireDate]
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

      // If duplicate name was detected, record an in-app notification for the admin
      if (hasDuplicate && req.auth.userId) {
        try {
          const matchRoles = duplicateMatches.map(d => `${d.role || 'user'} (${d.email})`).join(', ');
          const notifMsg = `Duplicate Name Notice: Teacher "${firstName} ${lastName}" was registered, but ${duplicateMatches.length} matching user(s) already exist: ${matchRoles}.`;
          await query(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [req.auth.userId, notifMsg]
          );
        } catch (notifErr) {
          console.error('Failed to log duplicate teacher notification:', notifErr);
        }
      }

      const rows = await query(SELECT_TEACHER + ' WHERE teachers.user_id = ? LIMIT 1', [userId]);
      res.status(201).json({
        data: rows[0],
        duplicate_detected: hasDuplicate,
        duplicate_count: duplicateMatches.length,
        duplicate_matches: duplicateMatches
      });
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
      phone,
      gender,
      birth_date: birthDate,
      photo,
      employee_number: employeeNumber,
      speciality,
      specialization,
      diploma,
      national_id: nationalId,
      social_security_number: socialSecurityNumber,
      hire_date: hireDate,
      monthly_salary: monthlySalary,
      ccp_rib: ccpRib,
      preferred_pay_method: preferredPayMethod,
      rfid_tag: rfidTag,
    } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const userUpdates = [];
      const userValues = [];
      if (firstName !== undefined) { userUpdates.push('first_name = ?'); userValues.push(firstName); }
      if (lastName !== undefined)  { userUpdates.push('last_name = ?');  userValues.push(lastName); }
      if (email !== undefined)     { userUpdates.push('email = ?');      userValues.push(email); }
      if (phone !== undefined)     { userUpdates.push('phone = ?');      userValues.push(phone || null); }
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
      if (phone !== undefined)          { tUpdates.push('phone = ?');           tValues.push(phone || null); }
      if (speciality !== undefined)     { tUpdates.push('speciality = ?');      tValues.push(speciality); }
      if (specialization !== undefined) { tUpdates.push('specialization = ?');  tValues.push(specialization); }
      if (diploma !== undefined)        { tUpdates.push('diploma = ?');         tValues.push(diploma); }
      if (nationalId !== undefined)     { tUpdates.push('national_id = ?');     tValues.push(nationalId); }
      if (socialSecurityNumber !== undefined) { tUpdates.push('social_security_number = ?'); tValues.push(socialSecurityNumber); }
      if (hireDate !== undefined)       { tUpdates.push('hire_date = ?');       tValues.push(hireDate); }
      if (monthlySalary !== undefined)  { tUpdates.push('monthly_salary = ?');   tValues.push(monthlySalary === '' || monthlySalary === null ? null : parseFloat(monthlySalary)); }
      if (ccpRib !== undefined)         { tUpdates.push('ccp_rib = ?');          tValues.push(ccpRib || null); }
      if (preferredPayMethod !== undefined) { tUpdates.push('preferred_pay_method = ?'); tValues.push(preferredPayMethod || null); }
      if (rfidTag !== undefined)        { tUpdates.push('rfid_tag = ?');         tValues.push(rfidTag || null); }

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
