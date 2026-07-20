const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { query } = require('../config/db');

const router = express.Router();

async function getSchoolForUser(userId) {
  const schools = await query(
    `SELECT s.id, s.name, s.logo, s.admin_id, s.created_at
     FROM schools s
     LEFT JOIN school_users su ON su.school_id = s.id
     WHERE s.admin_id = ? OR su.user_id = ?
     ORDER BY s.created_at ASC LIMIT 1`,
    [userId, userId]
  );
  return schools[0] || null;
}

// ── Overview: counts ─────────────────────────────────────────────────────────
router.get('/overview', requireAuth, asyncHandler(async (req, res) => {
  const school = await getSchoolForUser(req.auth.userId);
  if (!school) throw new HttpError(409, 'School setup required');

  const sid = school.id;

  // Use role-based counts for teachers/students (bypasses school_id confusion)
  // Use school_id for classrooms/formations/groups (always set correctly)
  const [[tc], [sc], [clc], [fc], [gc], [uc]] = await Promise.all([
    query(`SELECT COUNT(*) AS n FROM teachers WHERE school_id = ?`, [sid]),
    query(`SELECT COUNT(*) AS n FROM students WHERE school_id = ?`, [sid]),
    query(`SELECT COUNT(*) AS n FROM classrooms WHERE school_id = ?`, [sid]),
    query(`SELECT COUNT(*) AS n FROM formations WHERE school_id = ?`, [sid]),
    query(
      `SELECT COUNT(*) AS n FROM \`groups\` g
       INNER JOIN formations f ON f.id = g.formation_id
       WHERE f.school_id = ?`,
      [sid]
    ),
    query(
      `SELECT COUNT(DISTINCT user_id) AS n FROM school_users WHERE school_id = ?`,
      [sid]
    ),
  ]);

  res.json({
    school,
    counts: {
      users:      Number(uc.n || 0),
      teachers:   Number(tc.n || 0),
      students:   Number(sc.n || 0),
      classrooms: Number(clc.n || 0),
      formations: Number(fc.n || 0),
      groups:     Number(gc.n || 0),
    },
  });
}));

// ── Recent students ───────────────────────────────────────────────────────────
router.get('/recent-students', requireAuth, asyncHandler(async (req, res) => {
  const school = await getSchoolForUser(req.auth.userId);
  if (!school) throw new HttpError(409, 'School setup required');

  const rows = await query(
    `SELECT s.id, s.registration_number, s.enrollment_date,
            u.first_name, u.last_name, u.email, u.photo
     FROM students s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.school_id = ?
     ORDER BY s.id DESC LIMIT 5`,
    [school.id]
  );
  res.json({ data: rows });
}));

// ── Recent teachers ───────────────────────────────────────────────────────────
router.get('/recent-teachers', requireAuth, asyncHandler(async (req, res) => {
  const school = await getSchoolForUser(req.auth.userId);
  if (!school) throw new HttpError(409, 'School setup required');

  const rows = await query(
    `SELECT t.id, t.employee_number, t.speciality, t.hire_date,
            u.first_name, u.last_name, u.email, u.photo
     FROM teachers t
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.school_id = ?
     ORDER BY t.id DESC LIMIT 5`,
    [school.id]
  );
  res.json({ data: rows });
}));

// ── Formations summary ────────────────────────────────────────────────────────
router.get('/formations-summary', requireAuth, asyncHandler(async (req, res) => {
  const school = await getSchoolForUser(req.auth.userId);
  if (!school) throw new HttpError(409, 'School setup required');

  const rows = await query(
    `SELECT f.id, f.title, f.price, f.start_date, f.end_date, f.image,
            CONCAT(u.first_name,' ',u.last_name) AS teacher_name,
            COUNT(DISTINCT sg.student_id) AS enrolled_students
     FROM formations f
     LEFT JOIN teachers t ON t.id = f.teacher_id
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN \`groups\` g ON g.formation_id = f.id
     LEFT JOIN student_groups sg ON sg.group_id = g.id
     WHERE f.school_id = ?
     GROUP BY f.id ORDER BY f.id DESC LIMIT 6`,
    [school.id]
  );
  res.json({ data: rows });
}));

module.exports = router;