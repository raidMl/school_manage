const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { query } = require('../config/db');

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

async function countRows(sql, params) {
  const rows = await query(sql, params);
  return Number(rows[0].count || 0);
}

router.get(
  '/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const school = await getSchoolForUser(req.auth.userId);

    if (!school) {
      throw new HttpError(409, 'School setup required');
    }

    const [users, teachers, students, classrooms, formations, groups] = await Promise.all([
      countRows(
        `SELECT COUNT(DISTINCT su.user_id) AS count
         FROM school_users su
         WHERE su.school_id = ?`,
        [school.id]
      ),
      countRows(
        `SELECT COUNT(*) AS count
         FROM teachers t
         INNER JOIN users u ON u.id = t.user_id
         INNER JOIN school_users su ON su.user_id = u.id
         WHERE su.school_id = ?`,
        [school.id]
      ),
      countRows(
        `SELECT COUNT(*) AS count
         FROM students s
         INNER JOIN users u ON u.id = s.user_id
         INNER JOIN school_users su ON su.user_id = u.id
         WHERE su.school_id = ?`,
        [school.id]
      ),
      countRows('SELECT COUNT(*) AS count FROM classrooms WHERE school_id = ?', [school.id]),
      countRows('SELECT COUNT(*) AS count FROM formations WHERE school_id = ?', [school.id]),
      countRows(
        `SELECT COUNT(*) AS count
         FROM groups g
         INNER JOIN formations f ON f.id = g.formation_id
         WHERE f.school_id = ?`,
        [school.id]
      ),
    ]);

    res.json({
      school,
      counts: {
        users,
        teachers,
        students,
        classrooms,
        formations,
        groups,
      },
    });
  })
);

module.exports = router;