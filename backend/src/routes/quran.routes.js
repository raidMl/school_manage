const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const requireAuth = require('../middleware/auth');

/* ── helpers ─────────────────────────────────────────────────────────── */
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

/* ── ensure table exists and schema is up to date (auto-migrate) ──────── */
async function ensureTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS quran_memorization (
        id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        school_id     INT          NOT NULL,
        student_id    INT          NOT NULL,
        group_id      INT          DEFAULT NULL,
        formation_id  BIGINT(20) UNSIGNED DEFAULT NULL,
        cycle         VARCHAR(100) DEFAULT NULL,
        session_date  DATE         NOT NULL,
        amount        VARCHAR(255) NOT NULL,
        level         VARCHAR(100) DEFAULT NULL,
        notes         TEXT         DEFAULT NULL,
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_school    (school_id),
        INDEX idx_student   (student_id),
        INDEX idx_group     (group_id),
        INDEX idx_formation (formation_id),
        INDEX idx_date      (session_date),
        INDEX idx_cycle     (cycle)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const cols = await query(`SHOW COLUMNS FROM quran_memorization LIKE 'cycle'`);
    if (!cols || cols.length === 0) {
      await query(`ALTER TABLE quran_memorization ADD COLUMN cycle VARCHAR(100) DEFAULT NULL AFTER group_id`);
      await query(`ALTER TABLE quran_memorization ADD INDEX idx_cycle (cycle)`);
    }

    const formCols = await query(`SHOW COLUMNS FROM quran_memorization LIKE 'formation_id'`);
    if (!formCols || formCols.length === 0) {
      await query(`ALTER TABLE quran_memorization ADD COLUMN formation_id BIGINT(20) UNSIGNED DEFAULT NULL AFTER group_id`);
      await query(`ALTER TABLE quran_memorization ADD INDEX idx_formation (formation_id)`);
    }
  } catch (err) {
    console.error('[quran.routes] ensureTable error:', err);
  }
}
ensureTable().catch(console.error);

/* GET /api/quran ─────────────────────────────────────────────────────── */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const { group_id, student_id, formation_id, formation_type, cycle, level, date_from, date_to, search } = req.query;

    let sql = `
      SELECT
        qm.id, qm.school_id, qm.student_id, qm.group_id, qm.formation_id,
        qm.cycle, qm.session_date, qm.amount, qm.level, qm.notes, qm.created_at,
        u.first_name, u.last_name, u.photo,
        s.gender, s.registration_number,
        g.name AS group_name,
        COALESCE(f.title, fg.title) AS formation_title,
        COALESCE(f.type,  fg.type)  AS formation_type,
        COALESCE(f.niveau, fg.niveau) AS formation_niveau
      FROM quran_memorization qm
      JOIN students s   ON qm.student_id = s.id
      JOIN users    u   ON s.user_id     = u.id
      LEFT JOIN \`groups\`  g  ON qm.group_id    = g.id
      LEFT JOIN formations f  ON qm.formation_id = f.id
      LEFT JOIN formations fg ON g.formation_id  = fg.id
      WHERE qm.school_id = ?
    `;
    const params = [schoolId];

    if (group_id)       { sql += ' AND qm.group_id = ?';                          params.push(group_id); }
    if (student_id)     { sql += ' AND qm.student_id = ?';                        params.push(student_id); }
    if (formation_id)   { sql += ' AND (qm.formation_id = ? OR fg.id = ?)';       params.push(formation_id, formation_id); }
    if (formation_type) { sql += ' AND COALESCE(f.type, fg.type) = ?';            params.push(formation_type); }
    if (cycle)          { sql += ' AND qm.cycle = ?';                             params.push(cycle); }
    if (level)          { sql += ' AND qm.level = ?';                             params.push(level); }
    if (date_from)      { sql += ' AND qm.session_date >= ?';                     params.push(date_from); }
    if (date_to)        { sql += ' AND qm.session_date <= ?';                     params.push(date_to); }
    if (search) {
      sql += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name,' ',u.last_name) LIKE ? OR s.registration_number LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    sql += ' ORDER BY qm.session_date DESC, qm.id DESC';

    const rows = await query(sql, params);
    res.json({ records: rows });
  } catch (err) { next(err); }
});

/* GET /api/quran/formations ─────────────────────────────────────────── */
router.get('/formations', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const rows = await query(
      `SELECT f.id, f.title, f.type, f.niveau,
              COUNT(DISTINCT s.id) AS student_count
       FROM formations f
       LEFT JOIN students s ON s.formation_id = f.id
       WHERE f.school_id = ?
       GROUP BY f.id
       ORDER BY f.type, f.title`,
      [schoolId]
    );
    res.json({ formations: rows });
  } catch (err) { next(err); }
});

/* GET /api/quran/niveaux ────────────────────────────────────────────── */
router.get('/niveaux', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const rows = await query(
      `SELECT DISTINCT TRIM(niveau) AS niveau, type
       FROM formations
       WHERE school_id = ? AND niveau IS NOT NULL AND TRIM(niveau) != ''
       ORDER BY niveau ASC`,
      [schoolId]
    );
    const memoLevels = await query(
      `SELECT DISTINCT TRIM(level) AS level
       FROM quran_memorization
       WHERE school_id = ? AND level IS NOT NULL AND TRIM(level) != ''`,
      [schoolId]
    );

    res.json({
      db_niveaux:     rows.map(r => r.niveau),
      db_memo_levels: memoLevels.map(r => r.level)
    });
  } catch (err) { next(err); }
});

/* GET /api/quran/cycles ─────────────────────────────────────────────── */
router.get('/cycles', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const rows = await query(
      `SELECT DISTINCT cycle FROM quran_memorization
       WHERE school_id = ? AND cycle IS NOT NULL AND cycle != ''
       ORDER BY cycle DESC`,
      [schoolId]
    );
    res.json({ cycles: rows.map(r => r.cycle) });
  } catch (err) { next(err); }
});

/* GET /api/quran/summary ────────────────────────────────────────────── */
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const { group_id, cycle, formation_id } = req.query;
    let sql = `
      SELECT
        qm.student_id,
        u.first_name, u.last_name, u.photo, u.gender,
        s.registration_number,
        g.name AS group_name,
        COALESCE(f.title, fg.title) AS formation_title,
        COUNT(qm.id)         AS total_sessions,
        MAX(qm.session_date) AS last_session,
        SUBSTRING_INDEX(GROUP_CONCAT(qm.level  ORDER BY qm.session_date DESC, qm.id DESC), ',', 1) AS current_level,
        SUBSTRING_INDEX(GROUP_CONCAT(qm.amount ORDER BY qm.session_date DESC, qm.id DESC), ',', 1) AS latest_amount,
        SUBSTRING_INDEX(GROUP_CONCAT(qm.cycle  ORDER BY qm.session_date DESC, qm.id DESC), ',', 1) AS latest_cycle
      FROM quran_memorization qm
      JOIN students s ON qm.student_id = s.id
      JOIN users    u ON s.user_id = u.id
      LEFT JOIN \`groups\`  g  ON qm.group_id    = g.id
      LEFT JOIN formations f  ON qm.formation_id = f.id
      LEFT JOIN formations fg ON g.formation_id  = fg.id
      WHERE qm.school_id = ?
    `;
    const params = [schoolId];
    if (group_id)     { sql += ' AND qm.group_id = ?';                                params.push(group_id); }
    if (cycle)        { sql += ' AND qm.cycle = ?';                                   params.push(cycle); }
    if (formation_id) { sql += ' AND (qm.formation_id = ? OR fg.id = ?)';             params.push(formation_id, formation_id); }
    sql += ' GROUP BY qm.student_id ORDER BY total_sessions DESC, last_session DESC';

    const rows = await query(sql, params);
    res.json({ summary: rows });
  } catch (err) { next(err); }
});

/* GET /api/quran/student-history/:studentId ─────────────────────────── */
router.get('/student-history/:studentId', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const studentRows = await query(
      `SELECT s.id, s.registration_number, u.first_name, u.last_name, u.photo, u.gender, g.name AS group_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN student_groups sg ON sg.student_id = s.id
       LEFT JOIN \`groups\` g ON sg.group_id = g.id
       WHERE s.id = ? AND s.school_id = ?
       LIMIT 1`,
      [req.params.studentId, schoolId]
    );
    if (studentRows.length === 0) return res.status(404).json({ message: 'Student not found' });

    const records = await query(
      `SELECT qm.*, g.name AS group_name
       FROM quran_memorization qm
       LEFT JOIN \`groups\` g ON qm.group_id = g.id
       WHERE qm.school_id = ? AND qm.student_id = ?
       ORDER BY qm.session_date DESC, qm.id DESC`,
      [schoolId, req.params.studentId]
    );

    res.json({ student: studentRows[0], records, total_sessions: records.length });
  } catch (err) { next(err); }
});

/* GET /api/quran/groups ─────────────────────────────────────────────── */
router.get('/groups', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const { formation_id } = req.query;
    let sql = `
      SELECT g.id, g.name, f.id AS formation_id, f.title AS formation_title, f.type AS formation_type,
             f.niveau AS formation_niveau,
             COUNT(sg.student_id) AS student_count
       FROM \`groups\` g
       LEFT JOIN formations f ON g.formation_id = f.id
       LEFT JOIN student_groups sg ON sg.group_id = g.id
       WHERE f.school_id = ?
    `;
    const params = [schoolId];
    if (formation_id) { sql += ' AND g.formation_id = ?'; params.push(formation_id); }
    sql += ' GROUP BY g.id ORDER BY g.name';

    const rows = await query(sql, params);
    res.json({ groups: rows });
  } catch (err) { next(err); }
});

/* GET /api/quran/students ───────────────────────────────────────────── */
router.get('/students', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const { search, formation_id, group_id } = req.query;
    let sql = `
      SELECT
        s.id, s.registration_number,
        u.first_name, u.last_name, u.photo, s.gender,
        f.id   AS formation_id,
        f.title AS formation_title,
        f.type  AS formation_type,
        f.niveau AS formation_niveau,
        GROUP_CONCAT(DISTINCT g.id   ORDER BY g.id SEPARATOR ',')  AS group_ids,
        GROUP_CONCAT(DISTINCT g.name ORDER BY g.id SEPARATOR ', ') AS group_names
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN formations f ON s.formation_id = f.id
      LEFT JOIN student_groups sg ON sg.student_id = s.id
      LEFT JOIN \`groups\` g ON sg.group_id = g.id
      WHERE s.school_id = ?
    `;
    const params = [schoolId];
    if (search) {
      sql += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name,' ',u.last_name) LIKE ? OR s.registration_number LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    if (formation_id) { sql += ' AND s.formation_id = ?'; params.push(formation_id); }
    if (group_id)     { sql += ' AND sg.group_id = ?';    params.push(group_id); }
    sql += ' GROUP BY s.id ORDER BY u.last_name, u.first_name';

    const rows = await query(sql, params);
    res.json({ students: rows });
  } catch (err) { next(err); }
});

/* GET /api/quran/students-in-group/:groupId ─────────────────────────── */
router.get('/students-in-group/:groupId', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const rows = await query(
      `SELECT s.id, s.registration_number, u.first_name, u.last_name, u.photo, s.gender,
              s.formation_id, f.title AS formation_title, f.niveau AS student_formation_niveau
       FROM student_groups sg
       JOIN students s ON sg.student_id = s.id
       JOIN users    u ON s.user_id = u.id
       LEFT JOIN formations f ON s.formation_id = f.id
       WHERE sg.group_id = ? AND s.school_id = ?
       ORDER BY u.last_name, u.first_name`,
      [req.params.groupId, schoolId]
    );
    res.json({ students: rows });
  } catch (err) { next(err); }
});

/* POST /api/quran ───────────────────────────────────────────────────── */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    let { student_id, group_id, formation_id, cycle, session_date, amount, level, notes } = req.body;
    if (!student_id || !session_date || !amount) {
      return res.status(400).json({ message: 'student_id, session_date and amount are required' });
    }

    if (!formation_id && group_id) {
      const gRow = await query('SELECT formation_id FROM `groups` WHERE id = ?', [group_id]);
      if (gRow.length) formation_id = gRow[0].formation_id;
    }
    if (!formation_id && student_id) {
      const sRow = await query('SELECT formation_id FROM students WHERE id = ?', [student_id]);
      if (sRow.length) formation_id = sRow[0].formation_id;
    }

    const result = await query(
      `INSERT INTO quran_memorization (school_id, student_id, group_id, formation_id, cycle, session_date, amount, level, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, student_id, group_id || null, formation_id || null,
       cycle ? cycle.trim() : null, session_date, amount.trim(), level || null, notes || null]
    );

    res.status(201).json({ message: 'Record added', id: result.insertId });
  } catch (err) { next(err); }
});

/* POST /api/quran/bulk ──────────────────────────────────────────────── */
router.post('/bulk', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    let { group_id, formation_id, cycle, session_date, records } = req.body;
    if (!session_date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'session_date and records[] are required' });
    }

    if (!formation_id && group_id) {
      const gRow = await query('SELECT formation_id FROM `groups` WHERE id = ?', [group_id]);
      if (gRow.length) formation_id = gRow[0].formation_id;
    }

    const filled = records.filter(r => r.amount && r.amount.trim());
    if (filled.length === 0) {
      return res.status(400).json({ message: 'At least one record must have an amount' });
    }

    const values = [];
    const placeholders = filled.map(r => {
      values.push(
        schoolId, r.student_id,
        group_id || null,
        formation_id || r.formation_id || null,
        (r.cycle || cycle || '').trim() || null,
        session_date, r.amount.trim(),
        r.level || null, r.notes || null
      );
      return '(?, ?, ?, ?, ?, ?, ?, ?, ?)';
    }).join(',');

    await query(
      `INSERT INTO quran_memorization (school_id, student_id, group_id, formation_id, cycle, session_date, amount, level, notes)
       VALUES ${placeholders}`,
      values
    );

    res.status(201).json({ message: `${filled.length} records added successfully` });
  } catch (err) { next(err); }
});

/* PUT /api/quran/:id ────────────────────────────────────────────────── */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    const { cycle, session_date, amount, level, notes, group_id, formation_id } = req.body;
    await query(
      `UPDATE quran_memorization
       SET cycle = ?, session_date = ?, amount = ?, level = ?, notes = ?, group_id = ?, formation_id = ?
       WHERE id = ? AND school_id = ?`,
      [cycle ? cycle.trim() : null, session_date, amount, level || null,
       notes || null, group_id || null, formation_id || null, req.params.id, schoolId]
    );
    res.json({ message: 'Record updated' });
  } catch (err) { next(err); }
});

/* DELETE /api/quran/:id ─────────────────────────────────────────────── */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) return res.status(403).json({ message: 'School not found' });

    await query(
      `DELETE FROM quran_memorization WHERE id = ? AND school_id = ?`,
      [req.params.id, schoolId]
    );
    res.json({ message: 'Record deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
