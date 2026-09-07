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

  let paymentAlert = null;
  if (req.auth.role === 'student') {
    const studentRows = await query(
      `SELECT s.id, DATE_FORMAT(s.next_payment_date, '%Y-%m-%d') AS next_payment_date,
              s.subscription_plan, s.payment_status,
              f.title AS formation_title,
              DATEDIFF(s.next_payment_date, CURDATE()) AS days_left
       FROM students s
       LEFT JOIN formations f ON f.id = s.formation_id
       WHERE s.user_id = ? AND s.next_payment_date IS NOT NULL
       LIMIT 1`,
      [req.auth.userId]
    );

    if (studentRows.length && studentRows[0].next_payment_date) {
      const s = studentRows[0];
      const days = Number(s.days_left);
      if (days <= 7) {
        paymentAlert = {
          student_id: s.id,
          next_payment_date: s.next_payment_date,
          subscription_plan: s.subscription_plan,
          formation_title: s.formation_title,
          days_left: days,
          urgency: days < 0 ? 'overdue' : (days <= 1 ? 'urgent' : 'warning')
        };
      }
    }
  }

  res.json({ notifications, paymentAlert });
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
