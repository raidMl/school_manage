const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { pool, query } = require('../config/db');

const router = express.Router();

// Helper: get school ID for the authenticated user
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

// ── PROGRAMS ─────────────────────────────────────────────────────────────────

// GET all programs for this school
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = await getSchoolId(req.auth.userId);
  const rows = await query(
    `SELECT id, name, description, status, created_at, updated_at
     FROM weekly_programs WHERE school_id = ? ORDER BY created_at DESC`,
    [schoolId]
  );
  res.json({ data: rows });
}));

// GET single program with slots + entries
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT * FROM weekly_programs WHERE id = ? LIMIT 1',
    [req.params.id]
  );
  if (!rows.length) throw new HttpError(404, 'Program not found');

  const slots = await query(
    'SELECT * FROM weekly_time_slots WHERE program_id = ? ORDER BY sort_order ASC, start_time ASC',
    [req.params.id]
  );

  const entries = await query(
    `SELECT wse.id, wse.slot_id, wse.day_of_week, wse.group_id, wse.subject_name, wse.color,
            wse.classroom_id,
            g.name AS group_name,
            f.title AS formation_title,
            cr.name AS classroom_name,
            CONCAT(tu.first_name,' ',tu.last_name) AS teacher_name
     FROM weekly_schedule_entries wse
     INNER JOIN \`groups\` g ON g.id = wse.group_id
     LEFT JOIN formations f ON f.id = g.formation_id
     LEFT JOIN classrooms cr ON cr.id = wse.classroom_id
     LEFT JOIN teachers t ON t.id = g.teacher_id
     LEFT JOIN users tu ON tu.id = t.user_id
     WHERE wse.slot_id IN (SELECT id FROM weekly_time_slots WHERE program_id = ?)`,
    [req.params.id]
  );

  res.json({ data: { ...rows[0], slots, entries } });
}));

// POST create a program
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = await getSchoolId(req.auth.userId);
  if (!schoolId) throw new HttpError(400, 'School not found for this user');
  const { name, description = null } = req.body;
  if (!name || !name.trim()) throw new HttpError(400, 'Program name is required');

  const result = await query(
    `INSERT INTO weekly_programs (school_id, name, description, status) VALUES (?, ?, ?, 'disabled')`,
    [schoolId, name.trim(), description]
  );
  const rows = await query('SELECT * FROM weekly_programs WHERE id = ? LIMIT 1', [result.insertId]);
  res.status(201).json({ data: rows[0] });
}));

// PUT update program name/description
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const updates = []; const vals = [];
  if (name !== undefined)        { updates.push('name = ?');        vals.push(name.trim()); }
  if (description !== undefined) { updates.push('description = ?'); vals.push(description); }
  if (!updates.length) throw new HttpError(400, 'No fields to update');
  vals.push(req.params.id);
  await query(`UPDATE weekly_programs SET ${updates.join(', ')} WHERE id = ?`, vals);
  const rows = await query('SELECT * FROM weekly_programs WHERE id = ? LIMIT 1', [req.params.id]);
  res.json({ data: rows[0] });
}));

// DELETE a program
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query('SELECT id FROM weekly_programs WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) throw new HttpError(404, 'Program not found');
  await query('DELETE FROM weekly_programs WHERE id = ?', [req.params.id]);
  res.status(204).send();
}));

// POST activate a program (deactivates all others for this school)
router.post('/:id/activate', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = await getSchoolId(req.auth.userId);
  const rows = await query('SELECT * FROM weekly_programs WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) throw new HttpError(404, 'Program not found');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Disable all programs for this school
    await connection.execute(
      `UPDATE weekly_programs SET status = 'disabled' WHERE school_id = ?`,
      [schoolId]
    );
    // Activate the selected one
    await connection.execute(
      `UPDATE weekly_programs SET status = 'active' WHERE id = ?`,
      [req.params.id]
    );
    await connection.commit();
  } catch (e) {
    await connection.rollback(); throw e;
  } finally {
    connection.release();
  }

  const updated = await query('SELECT * FROM weekly_programs WHERE id = ? LIMIT 1', [req.params.id]);
  res.json({ data: updated[0] });
}));

// ── TIME SLOTS ───────────────────────────────────────────────────────────────

// GET all slots for a program
router.get('/:id/slots', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT * FROM weekly_time_slots WHERE program_id = ? ORDER BY sort_order ASC, start_time ASC',
    [req.params.id]
  );
  res.json({ data: rows });
}));

// POST add a time slot to a program
router.post('/:id/slots', requireAuth, asyncHandler(async (req, res) => {
  const { label, start_time, end_time, sort_order = 0 } = req.body;
  if (!label || !start_time || !end_time) throw new HttpError(400, 'label, start_time and end_time are required');

  const result = await query(
    'INSERT INTO weekly_time_slots (program_id, label, start_time, end_time, sort_order) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, label.trim(), start_time, end_time, sort_order]
  );
  const rows = await query('SELECT * FROM weekly_time_slots WHERE id = ? LIMIT 1', [result.insertId]);
  res.status(201).json({ data: rows[0] });
}));

// PUT update a time slot
router.put('/:id/slots/:slotId', requireAuth, asyncHandler(async (req, res) => {
  const { label, start_time, end_time, sort_order } = req.body;
  const updates = []; const vals = [];
  if (label !== undefined)      { updates.push('label = ?');      vals.push(label.trim()); }
  if (start_time !== undefined) { updates.push('start_time = ?'); vals.push(start_time); }
  if (end_time !== undefined)   { updates.push('end_time = ?');   vals.push(end_time); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); vals.push(sort_order); }
  if (!updates.length) throw new HttpError(400, 'No fields to update');
  vals.push(req.params.slotId);
  await query(`UPDATE weekly_time_slots SET ${updates.join(', ')} WHERE id = ?`, vals);
  const rows = await query('SELECT * FROM weekly_time_slots WHERE id = ? LIMIT 1', [req.params.slotId]);
  res.json({ data: rows[0] });
}));

// DELETE a time slot (cascades to entries)
router.delete('/:id/slots/:slotId', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM weekly_time_slots WHERE id = ?', [req.params.slotId]);
  res.status(204).send();
}));

// ── SCHEDULE ENTRIES ─────────────────────────────────────────────────────────

// GET all entries for a program
router.get('/:id/entries', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT wse.id, wse.slot_id, wse.day_of_week, wse.group_id, wse.subject_name, wse.color,
            wse.classroom_id,
            g.name AS group_name,
            f.title AS formation_title,
            cr.name AS classroom_name,
            CONCAT(tu.first_name,' ',tu.last_name) AS teacher_name
     FROM weekly_schedule_entries wse
     INNER JOIN \`groups\` g ON g.id = wse.group_id
     LEFT JOIN formations f ON f.id = g.formation_id
     LEFT JOIN classrooms cr ON cr.id = wse.classroom_id
     LEFT JOIN teachers t ON t.id = g.teacher_id
     LEFT JOIN users tu ON tu.id = t.user_id
     WHERE wse.slot_id IN (SELECT id FROM weekly_time_slots WHERE program_id = ?)`,
    [req.params.id]
  );
  res.json({ data: rows });
}));

// POST add an entry to a program slot
router.post('/:id/entries', requireAuth, asyncHandler(async (req, res) => {
  const { slot_id, day_of_week, group_id, subject_name, color = '#4f6eff', classroom_id = null } = req.body;
  if (!slot_id || !day_of_week || !group_id || !subject_name) {
    throw new HttpError(400, 'slot_id, day_of_week, group_id and subject_name are required');
  }

  const result = await query(
    'INSERT INTO weekly_schedule_entries (slot_id, day_of_week, group_id, subject_name, color, classroom_id) VALUES (?, ?, ?, ?, ?, ?)',
    [slot_id, day_of_week, group_id, subject_name.trim(), color, classroom_id]
  );

  const rows = await query(
    `SELECT wse.id, wse.slot_id, wse.day_of_week, wse.group_id, wse.subject_name, wse.color,
            wse.classroom_id,
            g.name AS group_name, f.title AS formation_title,
            cr.name AS classroom_name,
            wts.label AS time_slot_label,
            CONCAT(tu.first_name,' ',tu.last_name) AS teacher_name
     FROM weekly_schedule_entries wse
     INNER JOIN \`groups\` g ON g.id = wse.group_id
     LEFT JOIN formations f ON f.id = g.formation_id
     LEFT JOIN classrooms cr ON cr.id = wse.classroom_id
     LEFT JOIN teachers t ON t.id = g.teacher_id
     LEFT JOIN users tu ON tu.id = t.user_id
     LEFT JOIN weekly_time_slots wts ON wts.id = wse.slot_id
     WHERE wse.id = ? LIMIT 1`,
    [result.insertId]
  );
  
  const entryData = rows[0];
  const notifMsg = `Admin added ${entryData.subject_name} at ${entryData.time_slot_label} for ${entryData.formation_title || entryData.group_name}`;

  // Send notifications
  const teacher = await query('SELECT user_id FROM teachers WHERE id = (SELECT teacher_id FROM \`groups\` WHERE id = ?)', [group_id]);
  if (teacher.length && teacher[0].user_id) {
    await query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
      teacher[0].user_id, notifMsg
    ]);
  }
  
  const students = await query('SELECT s.user_id FROM students s JOIN student_groups sg ON s.id = sg.student_id WHERE sg.group_id = ?', [group_id]);
  for (const stu of students) {
    if (stu.user_id) {
      await query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
        stu.user_id, notifMsg
      ]);
    }
  }

  res.status(201).json({ data: entryData });
}));

// PUT update an entry
router.put('/:id/entries/:entryId', requireAuth, asyncHandler(async (req, res) => {
  const { group_id, subject_name, color, day_of_week, slot_id, classroom_id } = req.body;
  const updates = []; const vals = [];
  if (group_id !== undefined)     { updates.push('group_id = ?');     vals.push(group_id); }
  if (subject_name !== undefined) { updates.push('subject_name = ?'); vals.push(subject_name.trim()); }
  if (color !== undefined)        { updates.push('color = ?');        vals.push(color); }
  if (day_of_week !== undefined)  { updates.push('day_of_week = ?');  vals.push(day_of_week); }
  if (slot_id !== undefined)      { updates.push('slot_id = ?');      vals.push(slot_id); }
  if (classroom_id !== undefined) { updates.push('classroom_id = ?'); vals.push(classroom_id); }
  if (!updates.length) throw new HttpError(400, 'No fields to update');
  vals.push(req.params.entryId);
  await query(`UPDATE weekly_schedule_entries SET ${updates.join(', ')} WHERE id = ?`, vals);

  const rows = await query(
    `SELECT wse.id, wse.slot_id, wse.day_of_week, wse.group_id, wse.subject_name, wse.color,
            wse.classroom_id,
            g.name AS group_name, f.title AS formation_title,
            cr.name AS classroom_name,
            CONCAT(tu.first_name,' ',tu.last_name) AS teacher_name
     FROM weekly_schedule_entries wse
     INNER JOIN \`groups\` g ON g.id = wse.group_id
     LEFT JOIN formations f ON f.id = g.formation_id
     LEFT JOIN classrooms cr ON cr.id = wse.classroom_id
     LEFT JOIN teachers t ON t.id = g.teacher_id
     LEFT JOIN users tu ON tu.id = t.user_id
     WHERE wse.id = ? LIMIT 1`,
    [req.params.entryId]
  );
  res.json({ data: rows[0] });
}));

// DELETE an entry
router.delete('/:id/entries/:entryId', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM weekly_schedule_entries WHERE id = ?', [req.params.entryId]);
  res.status(204).send();
}));

module.exports = router;
