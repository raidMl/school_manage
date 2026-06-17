const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { query } = require('../config/db');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query('SELECT * FROM school_users ORDER BY school_id DESC, user_id DESC');
    res.json({ data: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { school_id: schoolId, user_id: userId } = req.body;

    if (!schoolId || !userId) {
      throw new HttpError(400, 'school_id and user_id are required');
    }

    await query('INSERT INTO school_users (school_id, user_id) VALUES (?, ?)', [schoolId, userId]);
    res.status(201).json({ message: 'User linked to school successfully' });
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const { school_id: schoolId, user_id: userId } = req.body;

    if (!schoolId || !userId) {
      throw new HttpError(400, 'school_id and user_id are required');
    }

    const result = await query('DELETE FROM school_users WHERE school_id = ? AND user_id = ?', [schoolId, userId]);

    if (!result.affectedRows) {
      throw new HttpError(404, 'School user relation not found');
    }

    res.status(204).send();
  })
);

module.exports = router;