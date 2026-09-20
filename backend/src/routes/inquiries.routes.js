const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { query } = require('../config/db');

const router = express.Router();

/**
 * GET /api/inquiries
 * List student enrollment inquiries (excludes School Manager system orders)
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT id, school_id, name, phone, formation_title, message, status, created_at, updated_at
       FROM landing_inquiries
       WHERE (formation_title IS NULL OR formation_title NOT LIKE '%School Manager%')
       ORDER BY id DESC`
    );
    res.json({ success: true, data: rows });
  })
);

/**
 * PATCH /api/inquiries/:id/status
 * Update status of an inquiry
 */
router.patch(
  '/:id/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['new', 'contacted', 'enrolled', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      throw new HttpError(400, 'Invalid status. Must be one of: ' + validStatuses.join(', '));
    }

    const result = await query(
      `UPDATE landing_inquiries SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new HttpError(404, 'Inquiry not found');
    }

    res.json({ success: true, message: 'Status updated successfully', status });
  })
);

/**
 * DELETE /api/inquiries/:id
 * Delete an inquiry
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await query(
      `DELETE FROM landing_inquiries WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new HttpError(404, 'Inquiry not found');
    }

    res.json({ success: true, message: 'Inquiry deleted successfully' });
  })
);

module.exports = router;
