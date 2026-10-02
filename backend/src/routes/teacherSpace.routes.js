const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireAuth = require('../middleware/auth');
const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'teacher') return res.status(403).json({ message: 'Forbidden: Teachers only' });

  // Get teacher info
  const teacherInfo = await query(`
    SELECT t.id as teacher_id, t.employee_number, t.speciality, t.hire_date,
           u.first_name, u.last_name, u.email, u.phone, u.photo, u.gender
    FROM teachers t
    JOIN users u ON t.user_id = u.id
    WHERE u.id = ?
  `, [req.auth.userId]);

  if (!teacherInfo.length) return res.status(404).json({ message: 'Teacher not found' });

  // Get formations they teach
  const formations = await query(`
    SELECT id, title, type, status 
    FROM formations
    WHERE teacher_id = ?
  `, [teacherInfo[0].teacher_id]);

  // Get groups they teach
  const groups = await query(`
    SELECT g.id, g.name, f.title as formation_title
    FROM \`groups\` g
    JOIN formations f ON g.formation_id = f.id
    WHERE g.teacher_id = ? OR f.teacher_id = ?
  `, [teacherInfo[0].teacher_id, teacherInfo[0].teacher_id]);

  res.json({
    profile: teacherInfo[0],
    formations: formations,
    groups: groups
  });
}));

router.put('/update-profile', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });

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
  if (req.auth.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });

  const teacher = await query('SELECT id FROM teachers WHERE user_id = ?', [req.auth.userId]);
  if (!teacher.length) return res.json({ data: [] });

  const attendance = await query(`
    SELECT a.date, a.status, a.scan_time, g.name as group_name, f.title as formation_title
    FROM attendance a
    LEFT JOIN \`groups\` g ON a.group_id = g.id
    LEFT JOIN formations f ON g.formation_id = f.id
    WHERE a.user_type = 'teacher' AND a.user_id = ?
    ORDER BY a.date DESC
  `, [teacher[0].id]);

  res.json({ data: attendance });
}));

router.get('/planning', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });

  const teacher = await query('SELECT id, school_id FROM teachers WHERE user_id = ?', [req.auth.userId]);
  if (!teacher.length) return res.json({ planning: [], slots: [], programs: [] });

  const teacherId = teacher[0].id;
  const schoolId = teacher[0].school_id;

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
           wp.id AS program_id, wp.name AS program_name
    FROM weekly_schedule_entries wse
    JOIN weekly_time_slots wts ON wse.slot_id = wts.id
    JOIN weekly_programs wp ON wts.program_id = wp.id
    JOIN \`groups\` g ON wse.group_id = g.id
    LEFT JOIN formations f ON g.formation_id = f.id
    LEFT JOIN classrooms cr ON wse.classroom_id = cr.id
    LEFT JOIN classrooms cr_grp ON g.classroom_id = cr_grp.id
    LEFT JOIN classrooms cr_form ON f.classroom_id = cr_form.id
    WHERE wp.id IN (${placeholders})
      AND (g.teacher_id = ? OR f.teacher_id = ?)
    ORDER BY wse.day_of_week ASC, wts.start_time ASC, wts.sort_order ASC
  `, [...programIds, teacherId, teacherId]);

  const slots = await query(`
    SELECT DISTINCT label, start_time, end_time, sort_order
    FROM weekly_time_slots
    WHERE program_id IN (${placeholders})
    ORDER BY start_time ASC, sort_order ASC
  `, programIds);

  res.json({ planning, slots, programs });
}));

router.get('/payments', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'teacher') return res.status(403).json({ message: 'Forbidden: Teachers only' });

  const teacher = await query('SELECT id FROM teachers WHERE user_id = ?', [req.auth.userId]);
  if (!teacher.length) return res.json({ data: [], total: 0 });

  const { year } = req.query;
  let sql = `
    SELECT tp.id, tp.amount, tp.pay_month, tp.pay_year, tp.payment_date,
           tp.method, tp.notes,
           ru.first_name AS recorded_by_first, ru.last_name AS recorded_by_last
    FROM teacher_payments tp
    LEFT JOIN users ru ON ru.id = tp.recorded_by
    WHERE tp.teacher_id = ?
  `;
  const params = [teacher[0].id];

  if (year) { sql += ' AND tp.pay_year = ?'; params.push(year); }
  sql += ' ORDER BY tp.pay_year DESC, tp.pay_month DESC';

  const rows = await query(sql, params);
  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  res.json({ data: rows, total });
}));

module.exports = router;

