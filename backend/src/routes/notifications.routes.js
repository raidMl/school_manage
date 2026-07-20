const express = require('express');
const { query } = require('../config/db');
const requireAuth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// GET all unread notifications for the current user
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const notifications = await query(
    'SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC',
    [req.auth.userId]
  );
  res.json({ notifications });
}));

// PUT mark a notification as read
router.put('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.auth.userId]);
  res.json({ success: true });
}));

// PUT mark all notifications as read
router.put('/read-all', requireAuth, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [req.auth.userId]);
  res.json({ success: true });
}));

module.exports = router;
