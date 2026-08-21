const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const requireAuth = require('../middleware/auth');
const { pool, query } = require('../config/db');
const bcrypt = require('bcryptjs');

const router = express.Router();

async function getSchoolForUser(userId) {
  const schools = await query(
    `SELECT s.id, s.name, s.logo, s.admin_id, s.contact_info_id, s.created_at,
            s.type, s.phone_landline, s.phone_1, s.phone_2, s.email, s.fax,
            s.state, s.district, s.municipality, s.postal_code, s.po_box, s.address
     FROM schools s
     LEFT JOIN school_users su ON su.school_id = s.id
     WHERE s.admin_id = ? OR su.user_id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId, userId]
  );

  return schools[0] || null;
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const school = await getSchoolForUser(req.auth.userId);
    res.json({ school, needsSchoolSetup: !school });
  })
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { 
      name, logo = null, contact_info_id: contactInfoId = null,
      type = null, phone_landline = null, phone_1 = null, phone_2 = null,
      email = null, fax = null, state = null, district = null,
      municipality = null, postal_code = null, po_box = null, address = null
    } = req.body;

    if (!name) {
      throw new HttpError(400, 'name is required');
    }

    const users = await query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [req.auth.userId]);
    const user = users[0];

    if (!user) {
      throw new HttpError(401, 'Invalid authentication token');
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new HttpError(403, 'Only admins can create a school');
    }

    const existingSchool = await getSchoolForUser(user.id);

    if (existingSchool) {
      res.json({ school: existingSchool, needsSchoolSetup: false });
      return;
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [schoolResult] = await connection.execute(
        `INSERT INTO schools (name, logo, admin_id, contact_info_id, type, phone_landline, phone_1, phone_2, email, fax, state, district, municipality, postal_code, po_box, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, logo, user.id, contactInfoId, type, phone_landline, phone_1, phone_2, email, fax, state, district, municipality, postal_code, po_box, address]
      );

      const schoolId = schoolResult.insertId;

      await connection.execute(
        `INSERT INTO school_users (school_id, user_id)
         VALUES (?, ?)`,
        [schoolId, user.id]
      );

      await connection.commit();

      const schools = await query(
        `SELECT id, name, logo, admin_id, contact_info_id, created_at,
                type, phone_landline, phone_1, phone_2, email, fax,
                state, district, municipality, postal_code, po_box, address
         FROM schools
         WHERE id = ?
         LIMIT 1`,
        [schoolId]
      );

      res.status(201).json({ school: schools[0], needsSchoolSetup: false });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);
router.get(
  '/settings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const school = await getSchoolForUser(req.auth.userId);
    let contact_info = null;
    let additional_admins = [];
    if (school && school.contact_info_id) {
      const ci = await query('SELECT fb, whatsapp, linkedin FROM contact_infos WHERE id = ? LIMIT 1', [school.contact_info_id]);
      if (ci.length) contact_info = ci[0];
    }
    if (school) {
      additional_admins = await query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.is_active
         FROM users u
         INNER JOIN school_users su ON su.user_id = u.id
         WHERE su.school_id = ? AND u.id <> ? AND u.role = 'admin'`,
        [school.id, req.auth.userId]
      );
    }
    const users = await query('SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1', [req.auth.userId]);
    const admin = users[0];
    
    res.json({ school, contact_info, admin, additional_admins });
  })
);

router.put(
  '/settings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { 
      name, logo, fb, whatsapp, linkedin, admin_first_name, admin_last_name, admin_email, admin_password,
      type, phone_landline, phone_1, phone_2, email, fax, state, district, municipality, postal_code, po_box, address
    } = req.body;
    if (!name) throw new HttpError(400, 'School name is required');

    const users = await query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [req.auth.userId]);
    const user = users[0];
    if (!user) throw new HttpError(401, 'Invalid authentication token');
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new HttpError(403, 'Only admins can update school settings');
    }

    const school = await getSchoolForUser(user.id);
    const isNew = !school;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Handle contact_info
      let contactInfoId = school ? school.contact_info_id : null;
      if (!contactInfoId && (fb || whatsapp || linkedin)) {
        const [ciRes] = await connection.execute(
          'INSERT INTO contact_infos (fb, whatsapp, linkedin) VALUES (?, ?, ?)',
          [fb || null, whatsapp || null, linkedin || null]
        );
        contactInfoId = ciRes.insertId;
      } else if (contactInfoId) {
        await connection.execute(
          'UPDATE contact_infos SET fb=?, whatsapp=?, linkedin=? WHERE id=?',
          [fb || null, whatsapp || null, linkedin || null, contactInfoId]
        );
      }

      // 2. Handle school
      let schoolId = school ? school.id : null;
      if (isNew) {
        const [schoolResult] = await connection.execute(
          'INSERT INTO schools (name, logo, admin_id, contact_info_id, type, phone_landline, phone_1, phone_2, email, fax, state, district, municipality, postal_code, po_box, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name, logo || null, user.id, contactInfoId || null, type || null, phone_landline || null, phone_1 || null, phone_2 || null, email || null, fax || null, state || null, district || null, municipality || null, postal_code || null, po_box || null, address || null]
        );
        schoolId = schoolResult.insertId;
        await connection.execute(
          'INSERT INTO school_users (school_id, user_id) VALUES (?, ?)',
          [schoolId, user.id]
        );
      } else {
        await connection.execute(
          'UPDATE schools SET name=?, logo=?, contact_info_id=?, type=?, phone_landline=?, phone_1=?, phone_2=?, email=?, fax=?, state=?, district=?, municipality=?, postal_code=?, po_box=?, address=? WHERE id=?',
          [name, logo || null, contactInfoId || null, type || null, phone_landline || null, phone_1 || null, phone_2 || null, email || null, fax || null, state || null, district || null, municipality || null, postal_code || null, po_box || null, address || null, schoolId]
        );
      }

      // 3. Handle admin profile update
      const updates = []; const vals = [];
      if (admin_first_name !== undefined) { updates.push('first_name=?'); vals.push(admin_first_name); }
      if (admin_last_name !== undefined) { updates.push('last_name=?'); vals.push(admin_last_name); }
      if (admin_email !== undefined) { updates.push('email=?'); vals.push(admin_email); }
      if (admin_password && admin_password.trim() !== '') {
        updates.push('password=?');
        vals.push(await bcrypt.hash(admin_password, 10));
      }
      if (updates.length > 0) {
        vals.push(user.id);
        await connection.execute(`UPDATE users SET ${updates.join(', ')} WHERE id=?`, vals);
      }

      // 4. Handle additional admin users
      const additionalAdmins = Array.isArray(req.body.additional_admins) ? req.body.additional_admins : [];
      for (const adminInfo of additionalAdmins) {
        if (!adminInfo || !adminInfo.first_name || !adminInfo.last_name || !adminInfo.email || !adminInfo.password) {
          continue;
        }
        const email = adminInfo.email.trim();
        const role = 'admin';
        const isActive = adminInfo.is_active === 0 || adminInfo.is_active === '0' ? 0 : 1;
        const [existing] = await connection.execute('SELECT id, role FROM users WHERE email = ? LIMIT 1', [email]);
        if (existing.length) {
          const existingUser = existing[0];
          if (existingUser.role !== role) {
            throw new HttpError(400, 'Existing user with email ' + email + ' is not an admin');
          }
          await connection.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive, existingUser.id]);
          await connection.execute('INSERT IGNORE INTO school_users (school_id, user_id) VALUES (?, ?)', [schoolId, existingUser.id]);
          continue;
        }
        const hashedPassword = await bcrypt.hash(adminInfo.password, 10);
        const [userResult] = await connection.execute(
          `INSERT INTO users (first_name, last_name, email, password, role, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [adminInfo.first_name.trim(), adminInfo.last_name.trim(), email, hashedPassword, role, isActive]
        );
        const newUserId = userResult.insertId;
        await connection.execute('INSERT INTO school_users (school_id, user_id) VALUES (?, ?)', [schoolId, newUserId]);
      }

      await connection.commit();
      res.json({ success: true, wasSetup: isNew });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

module.exports = router;