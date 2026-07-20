const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { pool, query } = require('../config/db');

const router = express.Router();

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

// ─── CLASSROOMS ─────────────────────────────────────────────────────────────

// GET all classrooms for this school
router.get('/classrooms', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = await getSchoolId(req.auth.userId);
  const rows = await query(
    `SELECT id, name, capacity, description, school_id, created_at
     FROM classrooms WHERE school_id = ? ORDER BY id DESC`,
    [schoolId]
  );
  res.json({ data: rows });
}));

// GET single classroom
router.get('/classrooms/:id', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM classrooms WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) throw new HttpError(404, 'Classroom not found');
  res.json({ data: rows[0] });
}));

// POST create classroom
router.post('/classrooms', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = await getSchoolId(req.auth.userId);
  const { name, capacity = null, description = null } = req.body;
  if (!name) throw new HttpError(400, 'name is required');
  const result = await query(
    'INSERT INTO classrooms (school_id, name, capacity, description) VALUES (?, ?, ?, ?)',
    [schoolId, name, capacity, description]
  );
  const rows = await query('SELECT * FROM classrooms WHERE id = ? LIMIT 1', [result.insertId]);
  res.status(201).json({ data: rows[0] });
}));

// PUT update classroom
router.put('/classrooms/:id', requireAuth, asyncHandler(async (req, res) => {
  const { name, capacity, description } = req.body;
  const updates = []; const vals = [];
  if (name !== undefined)        { updates.push('name = ?');        vals.push(name); }
  if (capacity !== undefined)    { updates.push('capacity = ?');    vals.push(capacity); }
  if (description !== undefined) { updates.push('description = ?'); vals.push(description); }
  if (!updates.length) throw new HttpError(400, 'No fields to update');
  vals.push(req.params.id);
  await query(`UPDATE classrooms SET ${updates.join(', ')} WHERE id = ?`, vals);
  const rows = await query('SELECT * FROM classrooms WHERE id = ? LIMIT 1', [req.params.id]);
  res.json({ data: rows[0] });
}));

// DELETE classroom
router.delete('/classrooms/:id', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM classrooms WHERE id = ?', [req.params.id]);
  res.status(204).send();
}));

// ─── GROUPS ─────────────────────────────────────────────────────────────────

const GROUP_SELECT = `
  SELECT
    g.id, g.name, g.formation_id, g.classroom_id, g.teacher_id,
    g.start_date, g.end_date, g.max_students, g.created_at,
    f.title AS formation_title, f.price AS formation_price, f.image AS formation_image,
    c.name AS classroom_name,
    COALESCE(CONCAT(tu.first_name,' ',tu.last_name), CONCAT(uf.first_name,' ',uf.last_name)) AS teacher_name,
    COUNT(DISTINCT sg.student_id) AS student_count
  FROM \`groups\` g
  LEFT JOIN formations f ON f.id = g.formation_id
  LEFT JOIN classrooms c ON c.id = g.classroom_id
  LEFT JOIN teachers gt ON gt.id = g.teacher_id
  LEFT JOIN users tu ON tu.id = gt.user_id
  LEFT JOIN teachers ft ON ft.id = f.teacher_id
  LEFT JOIN users uf ON uf.id = ft.user_id
  LEFT JOIN student_groups sg ON sg.group_id = g.id
`;
// GET all groups for this school
router.get('/groups', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = await getSchoolId(req.auth.userId);
  let extraWhere = '';
  let params = [schoolId];
  if (req.auth.role === 'teacher') {
    const teacher = await query('SELECT id FROM teachers WHERE user_id = ? LIMIT 1', [req.auth.userId]);
    if (teacher.length) {
      extraWhere = ' AND (g.teacher_id = ? OR f.teacher_id = ?)';
      params.push(teacher[0].id, teacher[0].id);
    } else {
      extraWhere = ' AND 1=0'; // no teacher record found
    }
  }

  const rows = await query(
    GROUP_SELECT +
    `WHERE f.school_id = ? ${extraWhere} GROUP BY g.id ORDER BY g.id DESC`,
    params
  );
  res.json({ data: rows });
}));

// GET single group with its students
router.get('/groups/:id', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query(
    GROUP_SELECT + `WHERE g.id = ? GROUP BY g.id LIMIT 1`,
    [req.params.id]
  );
  if (!rows.length) throw new HttpError(404, 'Group not found');

  const group = rows[0];
  // fetch assigned students
  const students = await query(
    `SELECT s.id, s.registration_number, u.first_name, u.last_name, u.email, u.photo
     FROM student_groups sg
     INNER JOIN students s ON s.id = sg.student_id
     INNER JOIN users u ON u.id = s.user_id
     WHERE sg.group_id = ?`,
    [req.params.id]
  );
  group.students = students;
  res.json({ data: group });
}));

// POST create group
router.post('/groups', requireAuth, asyncHandler(async (req, res) => {
  const {
    formation_id, classroom_id = null, name,
    start_date = null, end_date = null, max_students = null,
    teacher_id = null,
    student_ids = []   // array of student IDs to add immediately
  } = req.body;
  if (!formation_id || !name) throw new HttpError(400, 'formation_id and name are required');

  const formationRows = await query('SELECT teacher_id FROM formations WHERE id = ? LIMIT 1', [formation_id]);
  if (!formationRows.length) throw new HttpError(404, 'Formation not found');
  let normalizedTeacherId = teacher_id === '' || teacher_id === undefined ? null : teacher_id;
  if (!normalizedTeacherId && formationRows[0].teacher_id) normalizedTeacherId = formationRows[0].teacher_id;
  if (!normalizedTeacherId) throw new HttpError(400, 'Teacher is required for the group; select a teacher or assign one to the formation first');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO \`groups\` (formation_id, classroom_id, teacher_id, name, start_date, end_date, max_students)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [formation_id, classroom_id, normalizedTeacherId, name, start_date, end_date, max_students]
    );
    const groupId = result.insertId;

    // Add students
    for (const sid of student_ids) {
      try {
        await connection.execute(
          'INSERT INTO student_groups (student_id, group_id) VALUES (?, ?)',
          [sid, groupId]
        );
      } catch (e) { /* ignore duplicate */ }
    }
    await connection.commit();
    res.status(201).json({ data: { id: groupId, name, formation_id, classroom_id, teacher_id: normalizedTeacherId, student_count: student_ids.length } });
  } catch (e) {
    await connection.rollback(); throw e;
  } finally {
    connection.release();
  }
}));

// PUT update group metadata
router.put('/groups/:id', requireAuth, asyncHandler(async (req, res) => {
  const { name, classroom_id, start_date, end_date, max_students, teacher_id } = req.body;
  const updates = []; const vals = [];
  if (name !== undefined)         { updates.push('name = ?');         vals.push(name); }
  if (classroom_id !== undefined) { updates.push('classroom_id = ?'); vals.push(classroom_id || null); }
  if (teacher_id !== undefined)   {
    if (!teacher_id) throw new HttpError(400, 'teacher_id is required for the group');
    updates.push('teacher_id = ?'); vals.push(teacher_id);
  }
  if (start_date !== undefined)   { updates.push('start_date = ?');   vals.push(start_date); }
  if (end_date !== undefined)     { updates.push('end_date = ?');     vals.push(end_date); }
  if (max_students !== undefined) { updates.push('max_students = ?'); vals.push(max_students); }
  if (updates.length) {
    vals.push(req.params.id);
    await query(`UPDATE \`groups\` SET ${updates.join(', ')} WHERE id = ?`, vals);
  }
  const rows = await query(GROUP_SELECT + `WHERE g.id = ? GROUP BY g.id LIMIT 1`, [req.params.id]);
  res.json({ data: rows[0] });
}));

// DELETE group
router.delete('/groups/:id', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM student_groups WHERE group_id = ?', [req.params.id]);
  await query('DELETE FROM `groups` WHERE id = ?', [req.params.id]);
  res.status(204).send();
}));

// ─── STUDENT GROUPS (members management) ────────────────────────────────────

// GET all students in a group
router.get('/groups/:id/students', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT s.id, s.registration_number, s.enrollment_date,
            u.first_name, u.last_name, u.email, u.photo
     FROM student_groups sg
     INNER JOIN students s ON s.id = sg.student_id
     INNER JOIN users u ON u.id = s.user_id
     WHERE sg.group_id = ?`,
    [req.params.id]
  );
  res.json({ data: rows });
}));

// POST add students to group (accepts { student_ids: [1,2,3] })
router.post('/groups/:id/students', requireAuth, asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const { student_ids = [] } = req.body;
  if (!student_ids.length) throw new HttpError(400, 'student_ids array is required');

  const added = [];
  for (const sid of student_ids) {
    try {
      await query('INSERT INTO student_groups (student_id, group_id) VALUES (?, ?)', [sid, groupId]);
      added.push(sid);
    } catch (e) { /* ignore duplicate */ }
  }
  res.json({ added, message: `${added.length} student(s) added to group` });
}));

// DELETE remove a student from group
router.delete('/groups/:id/students/:studentId', requireAuth, asyncHandler(async (req, res) => {
  await query(
    'DELETE FROM student_groups WHERE group_id = ? AND student_id = ?',
    [req.params.id, req.params.studentId]
  );
  res.status(204).send();
}));

// ─── GET all students (for select dropdowns) ─────────────────────────────────
router.get('/students-list', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = await getSchoolId(req.auth.userId);
  const rows = await query(
    `SELECT s.id, s.registration_number, u.first_name, u.last_name, u.email, u.photo, u.is_active
     FROM students s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.school_id = ?
        OR s.user_id IN (SELECT user_id FROM school_users WHERE school_id = ?)
     ORDER BY u.last_name ASC`,
    [schoolId, schoolId]
  );
  res.json({ data: rows });
}));

// ─── GET all formations (for select dropdowns) ────────────────────────────────
router.get('/formations-list', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = await getSchoolId(req.auth.userId);
  const rows = await query(
    `SELECT f.id, f.title, f.type, f.image, f.start_date, f.end_date, f.teacher_id, f.status,
            CONCAT(u.first_name,' ',u.last_name) AS teacher_name
     FROM formations f
     LEFT JOIN teachers t ON t.id = f.teacher_id
     LEFT JOIN users u ON u.id = t.user_id
     WHERE f.school_id = ?
     ORDER BY f.title ASC`,
    [schoolId]
  );
  res.json({ data: rows });
}));

module.exports = router;
