const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { query } = require('../config/db');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query('SELECT * FROM student_groups ORDER BY student_id DESC, group_id DESC');
    res.json({ data: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { student_id: studentId, group_id: groupId } = req.body;

    if (!studentId || !groupId) {
      throw new HttpError(400, 'student_id and group_id are required');
    }

    await query('INSERT INTO student_groups (student_id, group_id) VALUES (?, ?)', [studentId, groupId]);
    res.status(201).json({ message: 'Student linked to group successfully' });
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const { student_id: studentId, group_id: groupId } = req.body;

    if (!studentId || !groupId) {
      throw new HttpError(400, 'student_id and group_id are required');
    }

    const result = await query('DELETE FROM student_groups WHERE student_id = ? AND group_id = ?', [studentId, groupId]);

    if (!result.affectedRows) {
      throw new HttpError(404, 'Student group relation not found');
    }

    res.status(204).send();
  })
);

module.exports = router;