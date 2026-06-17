const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { query } = require('../config/db');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query('SELECT * FROM user_contact_infos ORDER BY user_id DESC');
    res.json({ data: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { user_id: userId, contact_info_id: contactInfoId } = req.body;

    if (!userId || !contactInfoId) {
      throw new HttpError(400, 'user_id and contact_info_id are required');
    }

    await query('INSERT INTO user_contact_infos (user_id, contact_info_id) VALUES (?, ?)', [userId, contactInfoId]);
    res.status(201).json({ message: 'Contact info linked to user successfully' });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const { user_id: userId, contact_info_id: contactInfoId } = req.body;

    if (!userId || !contactInfoId) {
      throw new HttpError(400, 'user_id and contact_info_id are required');
    }

    const result = await query('UPDATE user_contact_infos SET contact_info_id = ? WHERE user_id = ?', [contactInfoId, userId]);

    if (!result.affectedRows) {
      throw new HttpError(404, 'User contact info relation not found');
    }

    res.json({ message: 'User contact info updated successfully' });
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const { user_id: userId } = req.body;

    if (!userId) {
      throw new HttpError(400, 'user_id is required');
    }

    const result = await query('DELETE FROM user_contact_infos WHERE user_id = ?', [userId]);

    if (!result.affectedRows) {
      throw new HttpError(404, 'User contact info relation not found');
    }

    res.status(204).send();
  })
);

module.exports = router;