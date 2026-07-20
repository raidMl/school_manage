const express = require('express');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { pool, query } = require('../config/db');
const { signAuthToken } = require('../utils/jwt');

const router = express.Router();

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

async function getUserByEmail(email) {
  const users = await query(
    `SELECT id, first_name, last_name, email, password, role, gender, birth_date, photo, is_active, created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizeEmail(email)]
  );

  return users[0] || null;
}

async function getSchoolForUser(userId) {
  const schools = await query(
    `SELECT s.id, s.name, s.logo, s.admin_id, s.contact_info_id, s.created_at
     FROM schools s
     LEFT JOIN school_users su ON su.school_id = s.id
     WHERE s.admin_id = ? OR su.user_id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId, userId]
  );

  return schools[0] || null;
}

async function getAuthContext(userId) {
  const users = await query(
    `SELECT id, first_name, last_name, email, role, gender, birth_date, photo, is_active, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  if (!users.length) {
    throw new HttpError(401, 'Invalid authentication token');
  }

  const user = users[0];
  const school = await getSchoolForUser(user.id);

  return {
    user,
    school,
    needsSchoolSetup: user.role === 'admin' && !school,
  };
}

function createAuthResponse(context) {
  return {
    token: signAuthToken({ userId: context.user.id, role: context.user.role }),
    user: context.user,
    school: context.school,
    needsSchoolSetup: context.needsSchoolSetup,
  };
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { first_name: firstName, last_name: lastName, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!firstName || !lastName || !normalizedEmail || !password) {
      throw new HttpError(400, 'first_name, last_name, email, and password are required');
    }

    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new HttpError(409, 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const countRows = await query('SELECT COUNT(*) AS total FROM users');
    const role = countRows[0].total === 0 ? 'super_admin' : 'admin';

    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, normalizedEmail, hashedPassword, role]
    );

    const context = await getAuthContext(result.insertId);
    res.status(201).json(createAuthResponse(context));
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      throw new HttpError(400, 'email and password are required');
    }

    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const context = await getAuthContext(user.id);
    res.json(createAuthResponse(context));
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const context = await getAuthContext(req.auth.userId);
    res.json(context);
  })
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ message: 'Logged out successfully' });
  })
);

module.exports = router;