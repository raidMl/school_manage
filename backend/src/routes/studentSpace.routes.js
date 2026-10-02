const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireAuth = require('../middleware/auth');
const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'student') {
    return res.status(403).json({ message: 'Forbidden: Students only' });
  }

  // Get student info
  const studentInfo = await query(`
    SELECT s.id as student_id, s.registration_number, s.enrollment_date, s.payment_status, 
           s.subscription_plan, DATE_FORMAT(s.next_payment_date, '%Y-%m-%d') AS next_payment_date,
           DATEDIFF(s.next_payment_date, CURDATE()) AS days_left,
           u.first_name, u.last_name, u.email, u.phone, u.photo, u.gender,
           f.title as formation_title, f.type as formation_type
    FROM students s
    JOIN users u ON s.user_id = u.id
    JOIN formations f ON s.formation_id = f.id
    WHERE u.id = ?
  `, [req.auth.userId]);

  if (!studentInfo.length) return res.status(404).json({ message: 'Student not found' });

  // Get their groups
  const groups = await query(`
    SELECT g.id, g.name, f.title as formation_title
    FROM student_groups sg
    JOIN \`groups\` g ON sg.group_id = g.id
    JOIN formations f ON g.formation_id = f.id
    WHERE sg.student_id = ?
  `, [studentInfo[0].student_id]);

  res.json({
    profile: studentInfo[0],
    groups: groups
  });
}));

router.put('/update-profile', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'student') return res.status(403).json({ message: 'Forbidden' });

  const { email, password, photo, phone } = req.body;
  
  if (email) {
    await query('UPDATE users SET email = ? WHERE id = ?', [email, req.auth.userId]);
  }
  if (phone !== undefined) {
    await query('UPDATE users SET phone = ? WHERE id = ?', [phone, req.auth.userId]);
  }
  if (photo !== undefined) {
    await query('UPDATE users SET photo = ? WHERE id = ?', [photo, req.auth.userId]);
  }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.auth.userId]);
  }
  
  res.json({ message: 'Profile updated successfully' });
}));

router.get('/attendance', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'student') return res.status(403).json({ message: 'Forbidden' });

  const student = await query('SELECT id FROM students WHERE user_id = ?', [req.auth.userId]);
  if (!student.length) return res.json({ data: [] });

  const attendance = await query(`
    SELECT a.date, a.status, a.scan_time, g.name as group_name, f.title as formation_title
    FROM attendance a
    LEFT JOIN \`groups\` g ON a.group_id = g.id
    LEFT JOIN formations f ON g.formation_id = f.id
    WHERE a.user_type = 'student' AND a.user_id = ?
    ORDER BY a.date DESC
  `, [student[0].id]);

  res.json({ data: attendance });
}));

router.get('/planning', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'student') return res.status(403).json({ message: 'Forbidden' });

  const student = await query('SELECT id, school_id, formation_id FROM students WHERE user_id = ?', [req.auth.userId]);
  if (!student.length) return res.json({ planning: [], slots: [], programs: [] });

  const studentId = student[0].id;
  const schoolId = student[0].school_id;

  // Find active programs for this school (fallback to all programs if none marked active)
  let programs = await query(
    'SELECT id, name, description, status FROM weekly_programs WHERE school_id = ? AND status = "active"',
    [schoolId]
  );
  if (!programs.length) {
    programs = await query(
      'SELECT id, name, description, status FROM weekly_programs WHERE school_id = ?',
      [schoolId]
    );
  }
  if (!programs.length) return res.json({ planning: [], slots: [], programs: [] });

  const programIds = programs.map(p => p.id);
  const placeholders = programIds.map(() => '?').join(',');

  const planning = await query(`
    SELECT DISTINCT wse.id, wse.slot_id, wse.day_of_week, wse.subject_name,
           COALESCE(wse.color, '#4f6eff') AS color,
           wts.label AS time_slot, wts.start_time, wts.end_time, wts.sort_order,
           COALESCE(cr.name, cr_grp.name, cr_form.name, '—') AS room_name,
           g.id AS group_id, g.name AS group_name,
           f.id AS formation_id, f.title AS formation_title,
           CONCAT(COALESCE(tu.first_name, ''), ' ', COALESCE(tu.last_name, '')) AS teacher_name,
           wp.id AS program_id, wp.name AS program_name
    FROM weekly_schedule_entries wse
    JOIN weekly_time_slots wts ON wse.slot_id = wts.id
    JOIN weekly_programs wp ON wts.program_id = wp.id
    JOIN \`groups\` g ON wse.group_id = g.id
    LEFT JOIN formations f ON g.formation_id = f.id
    LEFT JOIN student_groups sg ON sg.group_id = g.id
    LEFT JOIN classrooms cr ON wse.classroom_id = cr.id
    LEFT JOIN classrooms cr_grp ON g.classroom_id = cr_grp.id
    LEFT JOIN classrooms cr_form ON f.classroom_id = cr_form.id
    LEFT JOIN teachers tch ON COALESCE(g.teacher_id, f.teacher_id) = tch.id
    LEFT JOIN users tu ON tch.user_id = tu.id
    WHERE wp.id IN (${placeholders})
      AND (sg.student_id = ? OR (sg.student_id IS NULL AND g.formation_id = ?))
    ORDER BY wse.day_of_week ASC, wts.start_time ASC, wts.sort_order ASC
  `, [...programIds, studentId, student[0].formation_id || 0]);

  const slots = await query(`
    SELECT DISTINCT label, start_time, end_time, sort_order
    FROM weekly_time_slots
    WHERE program_id IN (${placeholders})
    ORDER BY start_time ASC, sort_order ASC
  `, programIds);

  res.json({ planning, slots, programs });
}));

router.get('/payments', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'student') return res.status(403).json({ message: 'Forbidden: Students only' });

  const student = await query('SELECT id FROM students WHERE user_id = ?', [req.auth.userId]);
  if (!student.length) return res.json({ data: [], total: 0 });

  const rows = await query(`
    SELECT ph.id, ph.amount, ph.payment_date, ph.payment_method, ph.notes,
           ph.subscription_plan, ph.discount_percent,
           ru.first_name AS recorded_by_first, ru.last_name AS recorded_by_last
    FROM payment_history ph
    LEFT JOIN users ru ON ru.id = ph.recorded_by_user_id
    WHERE ph.student_id = ?
    ORDER BY ph.payment_date DESC, ph.created_at DESC
  `, [student[0].id]);

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  res.json({ data: rows, total });
}));

module.exports = router;

