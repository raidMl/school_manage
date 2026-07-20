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
           u.first_name, u.last_name, u.email, u.phone, u.photo,
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
  if (req.auth.role !== 'student') return res.status(403).json({ message: 'Forbidden' });

  const student = await query('SELECT id FROM students WHERE user_id = ?', [req.auth.userId]);
  if (!student.length) return res.json({ data: [] });

  const attendance = await query(`
    SELECT a.date, a.status, a.scan_time, g.name as group_name
    FROM attendance a
    LEFT JOIN \`groups\` g ON a.group_id = g.id
    WHERE a.user_type = 'student' AND a.user_id = ?
    ORDER BY a.date DESC
  `, [student[0].id]);

  res.json({ data: attendance });
}));

router.get('/planning', asyncHandler(async (req, res) => {
  if (req.auth.role !== 'student') return res.status(403).json({ message: 'Forbidden' });

  const student = await query('SELECT id, school_id FROM students WHERE user_id = ?', [req.auth.userId]);
  if (!student.length) return res.json({ planning: [] });

  // Find active program
  const programs = await query('SELECT id FROM weekly_programs WHERE school_id = ? AND status = "active" LIMIT 1', [student[0].school_id]);
  if (!programs.length) return res.json({ planning: [] });

  const planning = await query(`
    SELECT wse.day_of_week, wts.label as time_slot, wse.subject_name, cr.name as room_name, g.name as group_name, CONCAT(t.first_name, ' ', t.last_name) as teacher_name, f.title as formation_name
    FROM weekly_schedule_entries wse
    JOIN weekly_time_slots wts ON wse.slot_id = wts.id
    JOIN \`groups\` g ON wse.group_id = g.id
    JOIN student_groups sg ON sg.group_id = g.id
    LEFT JOIN classrooms cr ON wse.classroom_id = cr.id
    LEFT JOIN teachers tch ON g.teacher_id = tch.id
    LEFT JOIN users t ON tch.user_id = t.id
    LEFT JOIN formations f ON g.formation_id = f.id
    WHERE wts.program_id = ? AND sg.student_id = ?
    ORDER BY wse.day_of_week, wts.sort_order
  `, [programs[0].id, student[0].id]);

  res.json({ planning });
}));

module.exports = router;
