const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { pool, query } = require('../config/db');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT
        students.id,
        students.user_id,
        students.registration_number,
        students.parent_name,
        students.parent_phone,
        students.enrollment_date,
        users.first_name,
        users.last_name,
        users.email,
        users.gender,
        users.birth_date,
        users.photo,
        users.is_active,
        users.role,
        users.created_at
      FROM students
      INNER JOIN users ON users.id = students.user_id
      ORDER BY students.id DESC`
    );

    res.json({ data: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      gender = null,
      birth_date: birthDate = null,
      photo = null,
      registration_number: registrationNumber,
      parent_name: parentName = null,
      parent_phone: parentPhone = null,
      enrollment_date: enrollmentDate = null,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !registrationNumber) {
      throw new HttpError(400, 'first_name, last_name, email, password, and registration_number are required');
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        `INSERT INTO users (first_name, last_name, email, password, role, gender, birth_date, photo)
         VALUES (?, ?, ?, ?, 'student', ?, ?, ?)`,
        [firstName, lastName, email, password, gender, birthDate, photo]
      );

      const userId = userResult.insertId;

      await connection.execute(
        `INSERT INTO students (user_id, registration_number, parent_name, parent_phone, enrollment_date)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, registrationNumber, parentName, parentPhone, enrollmentDate]
      );

      await connection.commit();

      const rows = await query(
        `SELECT
          students.id,
          students.user_id,
          students.registration_number,
          students.parent_name,
          students.parent_phone,
          students.enrollment_date,
          users.first_name,
          users.last_name,
          users.email,
          users.gender,
          users.birth_date,
          users.photo,
          users.is_active,
          users.role,
          users.created_at
        FROM students
        INNER JOIN users ON users.id = students.user_id
        WHERE students.user_id = ?
        LIMIT 1`,
        [userId]
      );

      res.status(201).json({ data: rows[0] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

module.exports = router;