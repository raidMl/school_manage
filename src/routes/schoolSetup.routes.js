const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { pool, query } = require('../config/db');

const router = express.Router();

async function getSchoolForUser(userId) {
  const schools = await query(
    `SELECT s.id, s.name, s.logo, s.admin_id, s.contact_info_id, s.created_at
     FROM schools s
     LEFT JOIN school_users su ON su.school_id = s.id
     WHERE s.admin_id = ? OR su.user_id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId, userId]
  );

  return schools[0] || null;
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const school = await getSchoolForUser(req.auth.userId);
    res.json({ school, needsSchoolSetup: !school });
  })
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, logo = null, contact_info_id: contactInfoId = null } = req.body;

    if (!name) {
      throw new HttpError(400, 'name is required');
    }

    const users = await query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [req.auth.userId]);
    const user = users[0];

    if (!user) {
      throw new HttpError(401, 'Invalid authentication token');
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new HttpError(403, 'Only admins can create a school');
    }

    const existingSchool = await getSchoolForUser(user.id);

    if (existingSchool) {
      res.json({ school: existingSchool, needsSchoolSetup: false });
      return;
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [schoolResult] = await connection.execute(
        `INSERT INTO schools (name, logo, admin_id, contact_info_id)
         VALUES (?, ?, ?, ?)`,
        [name, logo, user.id, contactInfoId]
      );

      const schoolId = schoolResult.insertId;

      await connection.execute(
        `INSERT INTO school_users (school_id, user_id)
         VALUES (?, ?)`,
        [schoolId, user.id]
      );

      await connection.commit();

      const schools = await query(
        `SELECT id, name, logo, admin_id, contact_info_id, created_at
         FROM schools
         WHERE id = ?
         LIMIT 1`,
        [schoolId]
      );

      res.status(201).json({ school: schools[0], needsSchoolSetup: false });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

module.exports = router;