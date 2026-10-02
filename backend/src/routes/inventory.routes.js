const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { pool, query } = require('../config/db');

const router = express.Router();

/* ─── helpers ────────────────────────────────────────────────────────────── */
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

async function ensureTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS school_inventory (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      school_id     INT UNSIGNED NOT NULL,
      name          VARCHAR(255) NOT NULL,
      type          VARCHAR(100),
      quantity      INT          NOT NULL DEFAULT 1,
      emplacement   VARCHAR(255),
      status        VARCHAR(100),
      added_by      INT UNSIGNED,
      added_date    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_school (school_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

/* ─── GET /  — list all items ─────────────────────────────────────────────── */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');
    await ensureTable();

    const { search, type, status } = req.query;
    let sql = `
      SELECT i.*, u.first_name as added_by_name, u.last_name as added_by_last
      FROM school_inventory i
      LEFT JOIN users u ON i.added_by = u.id
      WHERE i.school_id = ?
    `;
    const params = [schoolId];

    if (search) { sql += ' AND (i.name LIKE ? OR i.emplacement LIKE ?)'; params.push('%'+search+'%', '%'+search+'%'); }
    if (type)   { sql += ' AND i.type = ?';   params.push(type); }
    if (status) { sql += ' AND i.status = ?'; params.push(status); }

    sql += ' ORDER BY i.added_date DESC, i.id DESC';

    const items = await query(sql, params);
    res.json({ data: items, total: items.length });
  })
);

/* ─── POST /  — add item ──────────────────────────────────────────────────── */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');
    await ensureTable();

    const userId = req.auth.userId;
    const { name, type, quantity, emplacement, status, added_date } = req.body;

    if (!name || !name.trim()) throw new HttpError(400, 'Item name is required');
    if (quantity == null || isNaN(quantity) || quantity < 0) throw new HttpError(400, 'Valid quantity is required');

    const [result] = await pool.execute(
      `INSERT INTO school_inventory (school_id, name, type, quantity, emplacement, status, added_by, added_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        name.trim(),
        type || null,
        parseInt(quantity),
        emplacement || null,
        status || null,
        userId,
        added_date || new Date().toISOString().slice(0, 19).replace('T', ' ')
      ]
    );

    res.status(201).json({ message: 'Item added successfully', itemId: result.insertId });
  })
);

/* ─── PUT /:id  — update item ─────────────────────────────────────────────── */
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const existing = await query(
      'SELECT id FROM school_inventory WHERE id = ? AND school_id = ? LIMIT 1',
      [req.params.id, schoolId]
    );
    if (!existing.length) throw new HttpError(404, 'Item not found');

    const { name, type, quantity, emplacement, status, added_date } = req.body;
    if (!name || !name.trim()) throw new HttpError(400, 'Item name is required');
    if (quantity == null || isNaN(quantity) || quantity < 0) throw new HttpError(400, 'Valid quantity is required');

    await pool.execute(
      `UPDATE school_inventory SET name=?, type=?, quantity=?, emplacement=?, status=?, added_date=?
       WHERE id = ?`,
      [
        name.trim(),
        type || null,
        parseInt(quantity),
        emplacement || null,
        status || null,
        added_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        req.params.id
      ]
    );

    res.json({ message: 'Item updated successfully' });
  })
);

/* ─── DELETE /:id  — remove item ──────────────────────────────────────────── */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const schoolId = await getSchoolId(req.auth.userId);
    if (!schoolId) throw new HttpError(400, 'No school found');

    const existing = await query(
      'SELECT id FROM school_inventory WHERE id = ? AND school_id = ? LIMIT 1',
      [req.params.id, schoolId]
    );
    if (!existing.length) throw new HttpError(404, 'Item not found');

    await pool.execute('DELETE FROM school_inventory WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item deleted successfully' });
  })
);

module.exports = router;
