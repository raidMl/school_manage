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
           u.first_name, u.last_name, u.email, u.phone, u.photo
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

  const { email, password, photo } = req.body;
  
  if (email) {
    await query('UPDATE users SET email = ? WHERE id = ?', [email, req.auth.userId]);
  }
  if (photo) {
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
    SELECT a.date, a.status, a.scan_time, g.name as group_name
    FROM attendance a
    LEFT JOIN \`groups\` g ON a.group_id = g.id
    WHERE a.user_type = 'teacher' AND a.user_id = ?
    ORDER BY a.date DESC
  `, [teacher[0].id]);

  res.json({ data: attendance });
}));

router.get('/planning', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });

  const teacher = await query('SELECT id, school_id FROM teachers WHERE user_id = ?', [req.auth.userId]);
  if (!teacher.length) return res.json({ planning: [] });

  const programs = await query('SELECT id FROM weekly_programs WHERE school_id = ? AND status = "active" LIMIT 1', [teacher[0].school_id]);
  if (!programs.length) return res.json({ planning: [] });

  const planning = await query(`
    SELECT wse.day_of_week, wts.label as time_slot, wse.subject_name, cr.name as room_name, g.name as group_name, f.title as formation_name
    FROM weekly_schedule_entries wse
    JOIN weekly_time_slots wts ON wse.slot_id = wts.id
    LEFT JOIN \`groups\` g ON wse.group_id = g.id
    LEFT JOIN classrooms cr ON wse.classroom_id = cr.id
    LEFT JOIN formations f ON g.formation_id = f.id
    WHERE wts.program_id = ? AND g.teacher_id = ?
    ORDER BY wse.day_of_week, wts.sort_order
  `, [programs[0].id, teacher[0].id]);

  res.json({ planning });
}));

module.exports = router;
