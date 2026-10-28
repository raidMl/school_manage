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

  const teachersCount = Number(tc.n || 0);
  const studentsCount = Number(sc.n || 0);

  res.json({
    school,
    counts: {
      users:      teachersCount + studentsCount,
      teachers:   teachersCount,
      students:   studentsCount,
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

// ── Statistics (charts data) ──────────────────────────────────────────────────
router.get('/statistics', requireAuth, asyncHandler(async (req, res) => {
  const school = await getSchoolForUser(req.auth.userId);
  if (!school) throw new HttpError(409, 'School setup required');
  const sid = school.id;

  const [
    genderStudents,
    genderTeachers,
    studentsPerFormation,
    enrollmentByMonth,
    groupSizes,
    paymentByFormation,
    attendanceSummary,
    studentsByAge,
    [sc],
    [tc],
    [fc],
    [gc]
  ] = await Promise.all([
    query(
      `SELECT LOWER(COALESCE(s.gender, u.gender, 'unknown')) AS gender, COUNT(*) AS n 
       FROM students s 
       LEFT JOIN users u ON u.id = s.user_id 
       WHERE s.school_id = ? 
       GROUP BY gender`,
      [sid]
    ),
    query(
      `SELECT LOWER(COALESCE(u.gender, 'unknown')) AS gender, COUNT(*) AS n 
       FROM teachers t 
       INNER JOIN users u ON u.id = t.user_id 
       WHERE t.school_id = ? 
       GROUP BY gender`,
      [sid]
    ),
    query(
      `SELECT f.title, COUNT(DISTINCT sg.student_id) AS n 
       FROM formations f 
       LEFT JOIN \`groups\` g ON g.formation_id = f.id 
       LEFT JOIN student_groups sg ON sg.group_id = g.id 
       WHERE f.school_id = ? 
       GROUP BY f.id 
       ORDER BY n DESC 
       LIMIT 10`,
      [sid]
    ),
    query(
      `SELECT DATE_FORMAT(COALESCE(s.enrollment_date, s.created_at), '%Y-%m') AS month, COUNT(*) AS n 
       FROM students s 
       WHERE s.school_id = ? 
       GROUP BY month 
       ORDER BY month ASC 
       LIMIT 12`,
      [sid]
    ),
    query(
      `SELECT g.name, COUNT(sg.student_id) AS n 
       FROM \`groups\` g 
       INNER JOIN formations f ON f.id = g.formation_id 
       LEFT JOIN student_groups sg ON sg.group_id = g.id 
       WHERE f.school_id = ? 
       GROUP BY g.id 
       ORDER BY n DESC 
       LIMIT 10`,
      [sid]
    ),
    query(
      `SELECT f.title, COALESCE(SUM(ph.amount), 0) AS total 
       FROM formations f 
       LEFT JOIN students s ON s.formation_id = f.id 
       LEFT JOIN payment_history ph ON ph.student_id = s.id 
       WHERE f.school_id = ? 
       GROUP BY f.id 
       ORDER BY total DESC 
       LIMIT 10`,
      [sid]
    ),
    query(
      `SELECT a.status, COUNT(*) AS n 
       FROM attendance a 
       INNER JOIN \`groups\` g ON g.id = a.group_id 
       INNER JOIN formations f ON f.id = g.formation_id 
       WHERE f.school_id = ? 
       GROUP BY a.status`,
      [sid]
    ),
    query(
      `SELECT 
         CASE 
           WHEN TIMESTAMPDIFF(YEAR, COALESCE(s.birth_date, u.birth_date), CURDATE()) < 10 THEN 'Under 10' 
           WHEN TIMESTAMPDIFF(YEAR, COALESCE(s.birth_date, u.birth_date), CURDATE()) BETWEEN 10 AND 14 THEN '10-14' 
           WHEN TIMESTAMPDIFF(YEAR, COALESCE(s.birth_date, u.birth_date), CURDATE()) BETWEEN 15 AND 18 THEN '15-18' 
           WHEN TIMESTAMPDIFF(YEAR, COALESCE(s.birth_date, u.birth_date), CURDATE()) BETWEEN 19 AND 25 THEN '19-25' 
           WHEN TIMESTAMPDIFF(YEAR, COALESCE(s.birth_date, u.birth_date), CURDATE()) > 25 THEN 'Over 25' 
           ELSE 'Unknown' 
         END AS age_group, 
         COUNT(*) AS n 
       FROM students s 
       LEFT JOIN users u ON u.id = s.user_id 
       WHERE s.school_id = ? 
       GROUP BY age_group`,
      [sid]
    ),
    query(`SELECT COUNT(*) AS n FROM students WHERE school_id = ?`, [sid]),
    query(`SELECT COUNT(*) AS n FROM teachers WHERE school_id = ?`, [sid]),
    query(`SELECT COUNT(*) AS n FROM formations WHERE school_id = ?`, [sid]),
    query(
      `SELECT COUNT(*) AS n FROM \`groups\` g 
       INNER JOIN formations f ON f.id = g.formation_id 
       WHERE f.school_id = ?`,
      [sid]
    )
  ]);

  res.json({
    school,
    counts: {
      students: Number(sc?.n || 0),
      teachers: Number(tc?.n || 0),
      formations: Number(fc?.n || 0),
      groups: Number(gc?.n || 0)
    },
    genderStudents,
    genderTeachers,
    studentsPerFormation,
    enrollmentByMonth,
    groupSizes,
    paymentByFormation,
    attendanceSummary,
    studentsByAge
  });
}));

// ── Breakdown Statistics (per teacher, formation, group, with period filter) ──
router.get('/breakdown', requireAuth, asyncHandler(async (req, res) => {
  try {
    const school = await getSchoolForUser(req.auth.userId);
    if (!school) throw new HttpError(409, 'School setup required');
    const sid = school.id;

    const dateFrom = req.query.from || null;
    const dateTo   = req.query.to   || null;

    // Build date condition for payment_history
    let phDateCond = '';
    const phDateParams = [];
    if (dateFrom) { phDateCond += ' AND ph.payment_date >= ?'; phDateParams.push(dateFrom); }
    if (dateTo)   { phDateCond += ' AND ph.payment_date <= ?'; phDateParams.push(dateTo); }

    // Build date condition for enrollment
    let enrDateCond = '';
    const enrDateParams = [];
    if (dateFrom) { enrDateCond += ' AND COALESCE(s.enrollment_date, s.created_at) >= ?'; enrDateParams.push(dateFrom); }
    if (dateTo)   { enrDateCond += ' AND COALESCE(s.enrollment_date, s.created_at) <= ?'; enrDateParams.push(dateTo); }

    const [
      revenuePerTeacher,
      revenuePerFormation,
      subscriptionsPerFormation,
      studentsPerGroup,
      revenuePerGroup
    ] = await Promise.all([
      // 1. Revenue per teacher
      query(
        `SELECT t.id,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS teacher_name,
                t.employee_number,
                COALESCE(rev.total_revenue, 0) AS total_revenue,
                COALESCE(st.student_count, 0) AS student_count
         FROM teachers t
         INNER JOIN users u ON u.id = t.user_id
         LEFT JOIN (
           SELECT g.teacher_id, COALESCE(SUM(ph.amount), 0) AS total_revenue
           FROM \`groups\` g
           INNER JOIN payment_history ph ON (ph.group_id = g.id OR (ph.formation_id = g.formation_id AND ph.group_id IS NULL))
           WHERE g.teacher_id IS NOT NULL ${phDateCond}
           GROUP BY g.teacher_id
         ) rev ON rev.teacher_id = t.id
         LEFT JOIN (
           SELECT g.teacher_id, COUNT(DISTINCT sg.student_id) AS student_count
           FROM \`groups\` g
           INNER JOIN student_groups sg ON sg.group_id = g.id
           WHERE g.teacher_id IS NOT NULL
           GROUP BY g.teacher_id
         ) st ON st.teacher_id = t.id
         WHERE t.school_id = ?
         ORDER BY total_revenue DESC, student_count DESC
         LIMIT 100`,
        [...phDateParams, sid]
      ),
      // 2. Revenue per formation
      query(
        `SELECT f.id, f.title, f.price,
                COALESCE(p.total_revenue, 0) AS total_revenue,
                COALESCE(st.student_count, 0) AS student_count
         FROM formations f
         LEFT JOIN (
           SELECT COALESCE(ph.formation_id, g.formation_id) AS fid,
                  COALESCE(SUM(ph.amount), 0) AS total_revenue
           FROM payment_history ph
           LEFT JOIN \`groups\` g ON g.id = ph.group_id
           WHERE ph.school_id = ? ${phDateCond}
           GROUP BY fid
         ) p ON p.fid = f.id
         LEFT JOIN (
           SELECT f2.id AS fid, COUNT(DISTINCT s.id) AS student_count
           FROM formations f2
           LEFT JOIN students s ON s.formation_id = f2.id
           WHERE f2.school_id = ?
           GROUP BY f2.id
         ) st ON st.fid = f.id
         WHERE f.school_id = ?
         ORDER BY total_revenue DESC, student_count DESC
         LIMIT 100`,
        [sid, ...phDateParams, sid, sid]
      ),
      // 3. Subscriptions (enrolled students) per formation
      query(
        `SELECT f.id, f.title, f.price,
                COUNT(DISTINCT s.id) AS student_count
         FROM formations f
         LEFT JOIN students s ON s.formation_id = f.id ${enrDateCond}
         WHERE f.school_id = ?
         GROUP BY f.id, f.title, f.price
         ORDER BY student_count DESC
         LIMIT 100`,
        [...enrDateParams, sid]
      ),
      // 4. Students per group
      query(
        `SELECT g.id, g.name AS group_name, f.title AS formation_title,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS teacher_name,
                COALESCE(cnt.student_count, 0) AS student_count
         FROM \`groups\` g
         INNER JOIN formations f ON f.id = g.formation_id
         LEFT JOIN teachers t ON t.id = g.teacher_id
         LEFT JOIN users u ON u.id = t.user_id
         LEFT JOIN (
           SELECT sg.group_id, COUNT(DISTINCT sg.student_id) AS student_count
           FROM student_groups sg
           GROUP BY sg.group_id
         ) cnt ON cnt.group_id = g.id
         WHERE f.school_id = ?
         ORDER BY student_count DESC
         LIMIT 100`,
        [sid]
      ),
      // 5. Revenue per group
      query(
        `SELECT g.id, g.name AS group_name, f.title AS formation_title,
                COALESCE(p.total_revenue, 0) AS total_revenue,
                COALESCE(cnt.student_count, 0) AS student_count
         FROM \`groups\` g
         INNER JOIN formations f ON f.id = g.formation_id
         LEFT JOIN (
           SELECT ph.group_id, COALESCE(SUM(ph.amount), 0) AS total_revenue
           FROM payment_history ph
           WHERE ph.group_id IS NOT NULL ${phDateCond}
           GROUP BY ph.group_id
         ) p ON p.group_id = g.id
         LEFT JOIN (
           SELECT sg.group_id, COUNT(DISTINCT sg.student_id) AS student_count
           FROM student_groups sg
           GROUP BY sg.group_id
         ) cnt ON cnt.group_id = g.id
         WHERE f.school_id = ?
         ORDER BY total_revenue DESC, student_count DESC
         LIMIT 100`,
        [...phDateParams, sid]
      )
    ]);

    res.json({
      period: { from: dateFrom, to: dateTo },
      revenuePerTeacher,
      revenuePerFormation,
      subscriptionsPerFormation,
      studentsPerGroup,
      revenuePerGroup
    });
  } catch (err) {
    console.error('Breakdown route error:', err);
    throw err;
  }
}));

module.exports = router;
