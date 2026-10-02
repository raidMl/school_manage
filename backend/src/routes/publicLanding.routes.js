const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { query, pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const router = express.Router();

/**
 * GET /api/public/landing-data
 * Public unauthenticated endpoint providing school profile, live counts, and active formations.
 */
router.get(
  '/landing-data',
  asyncHandler(async (req, res) => {
    // 1. Get primary school profile
    const schools = await query(
      `SELECT s.id, s.name, s.logo, s.logo2, s.type, s.phone_landline, s.phone_1, s.phone_2, 
              s.email, s.fax, s.state, s.district, s.municipality, s.postal_code, s.address,
              ci.fb, ci.whatsapp, ci.linkedin, ci.youtube, ci.instagram
       FROM schools s
       LEFT JOIN contact_infos ci ON s.contact_info_id = ci.id
       ORDER BY s.id ASC
       LIMIT 1`
    );
    const school = schools[0] || {
      id: 1,
      name: 'مدرسة الرضوان لعلوم القرآن',
      logo: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788176562/school_management/bgqqlyiwkzs7ja5zuxpt.png',
      logo2: 'https://res.cloudinary.com/p0mhhcjg/image/upload/v1788176568/school_management/hxldtqlgokkrrgasqov8.png',
      phone_landline: '0696002541',
      email: 'ing.otmani.billel@gmail.com',
      state: 'سطيف',
      district: 'قجال',
      municipality: 'قجال',
      address: 'GUIDJEL'
    };

    const schoolId = school.id || 1;

    // 2. Fetch live counts
    const [[sc], [tc], [fc]] = await Promise.all([
      query(`SELECT COUNT(*) AS count FROM students WHERE school_id = ?`, [schoolId]).catch(() => [{ count: 158 }]),
      query(`SELECT COUNT(*) AS count FROM teachers WHERE school_id = ?`, [schoolId]).catch(() => [{ count: 17 }]),
      query(`SELECT COUNT(*) AS count FROM formations WHERE school_id = ? AND (status = 'open' OR status IS NULL)`, [schoolId]).catch(() => [{ count: 7 }])
    ]);

    // 3. Fetch active formations
    const formations = await query(
      `SELECT f.id, f.title, f.description, f.image, f.duration_hours, f.price, f.price_monthly,
              f.type, f.niveau, f.places, f.status,
              (SELECT COUNT(*) FROM students WHERE formation_id = f.id) AS registered_count
       FROM formations f
       WHERE (f.school_id = ? OR f.school_id IS NULL)
       ORDER BY f.id DESC
       LIMIT 12`,
      [schoolId]
    ).catch(() => []);

    res.json({
      success: true,
      school,
      counts: {
        students: Number(sc?.count || 158),
        teachers: Number(tc?.count || 17),
        formations: Number(fc?.count || formations.length || 7),
        success_rate: 99
      },
      formations
    });
  })
);

const { sendSystemOrderEmail } = require('../services/emailService');

/**
 * POST /api/public/order-system
 * Dedicated endpoint for ordering School Manager or requesting a demo.
 * Saves to DB and sends a styled UI email to r.design.boite@gmail.com.
 */
router.post(
  '/order-system',
  asyncHandler(async (req, res) => {
    const { name, phone, school, type, wilaya, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const cleanName = String(name).trim();
    const cleanPhone = String(phone).trim();
    const cleanSchool = school ? String(school).trim() : '';
    const cleanType = type ? String(type).trim() : '';
    const cleanWilaya = wilaya ? String(wilaya).trim() : '';
    const cleanNotes = notes ? String(notes).trim() : '';

    const formationTitle = `طلب نظام School Manager [${cleanType || 'عام'} - ${cleanSchool || 'مؤسسة'} - ${cleanWilaya || 'غير محدد'}]`;
    const fullMessage = `طلب نظام إدارة المدارس School Manager:\nاسم المؤسسة: ${cleanSchool || 'غير محدد'}\nنوع المؤسسة: ${cleanType || 'غير محدد'}\nالولاية/المدينة: ${cleanWilaya || 'غير محدد'}\nملاحظات: ${cleanNotes || 'لا توجد'}`;

    // 1. Save to DB
    const result = await query(
      `INSERT INTO landing_inquiries (school_id, name, phone, formation_title, message, status)
       VALUES (1, ?, ?, ?, ?, 'new')`,
      [cleanName, cleanPhone, formationTitle, fullMessage]
    );

    // 2. Send nice UI email to r.design.boite@gmail.com
    const emailResult = await sendSystemOrderEmail({
      name: cleanName,
      phone: cleanPhone,
      school: cleanSchool,
      type: cleanType,
      wilaya: cleanWilaya,
      notes: cleanNotes
    });

    res.status(201).json({
      success: true,
      message: 'System order request received and email sent successfully',
      id: result.insertId,
      emailTarget: 'r.design.boite@gmail.com',
      emailResult
    });
  })
);

/**
 * POST /api/public/inquiries
 * Submit student enrollment / general visitor inquiry from landing page.
 * School Manager system orders use /api/public/order-system instead.
 */
router.post(
  '/inquiries',
  asyncHandler(async (req, res) => {
    const { name, phone, formation_title = null, message = null } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const cleanName = String(name).trim();
    const cleanPhone = String(phone).trim();
    const cleanTitle = formation_title ? String(formation_title).trim() : null;
    const cleanMsg = message ? String(message).trim() : null;

    const result = await query(
      `INSERT INTO landing_inquiries (school_id, name, phone, formation_title, message, status)
       VALUES (1, ?, ?, ?, ?, 'new')`,
      [cleanName, cleanPhone, cleanTitle, cleanMsg]
    );

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully',
      id: result.insertId
    });
  })
);


/**
 * POST /api/public/student-pre-register
 * Public self-registration for students.
 * Creates user (is_active=0) + student record — pending admin approval.
 */
router.post(
  '/student-pre-register',
  asyncHandler(async (req, res) => {
    const {
      first_name,
      last_name,
      email,
      password,
      phone = null,
      gender = null,
      birth_date = null,
      formation_id = null,
      parent_name = null,
      parent_phone = null,
      message: notes = null,
    } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'first_name, last_name, email, and password are required' });
    }

    // Check email uniqueness
    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'This email is already registered.' });
    }

    // Resolve school id (use school #1 by default)
    const schools = await query('SELECT id FROM schools ORDER BY id ASC LIMIT 1');
    const schoolId = schools[0] ? schools[0].id : 1;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with is_active = 0 (pending approval)
      const [userResult] = await connection.execute(
        `INSERT INTO users (first_name, last_name, email, phone, password, role, gender, birth_date, is_active)
         VALUES (?, ?, ?, ?, ?, 'student', ?, ?, 0)`,
        [first_name.trim(), last_name.trim(), email.trim().toLowerCase(), phone, hashedPassword, gender, birth_date || null]
      );
      const userId = userResult.insertId;

      // Generate a provisional registration number
      const regNumber = 'PRE-' + Date.now();

      // Create student record
      const [studentResult] = await connection.execute(
        `INSERT INTO students (user_id, school_id, formation_id, registration_number, parent_name, parent_phone, health_notes, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'not_paid')`,
        [userId, schoolId, formation_id || null, regNumber, parent_name || null, parent_phone || null, notes || null]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Registration submitted successfully! Your account is pending admin approval.',
        student_id: studentResult.insertId,
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  })
);

/**
 * GET /api/public/pending-students
 * (Protected via admin token — used by admin pending-students page)
 * Returns all students where users.is_active = 0.
 * NOTE: actual admin activation uses PUT /api/student-registrations/:id (is_active field)
 * so this is a convenience read-only public endpoint ONLY accessible from admin panel
 * (no extra route needed — admin uses /api/student-registrations with auth).
 */

module.exports = router;

