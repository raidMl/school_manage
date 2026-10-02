const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const requireAuth = require("../middleware/auth");

// Helper to determine the relevant school ID
async function getSchoolId(userId) {
  try {
    const rows = await query(
      `SELECT s.id FROM schools s
       LEFT JOIN school_users su ON su.school_id = s.id
       WHERE s.admin_id = ? OR su.user_id = ?
       ORDER BY s.created_at DESC LIMIT 1`,
      [userId, userId]
    );
    if (rows && rows.length && rows[0].id) {
      return rows[0].id;
    }
  } catch (err) {
    console.error("Error fetching schoolId for userId:", userId, err.message);
  }

  // Fallback: use first available school so admin is never locked out of 0 records
  try {
    const defaultSchool = await query("SELECT id FROM schools ORDER BY id ASC LIMIT 1");
    if (defaultSchool && defaultSchool.length && defaultSchool[0].id) {
      return defaultSchool[0].id;
    }
  } catch (err) {
    console.error("Error fetching default school:", err.message);
  }
  return 1;
}

// Middleware: restrict writing/linking to admin or super_admin
function requireAdmin(req, res, next) {
  if (!req.auth || (req.auth.role !== "admin" && req.auth.role !== "super_admin")) {
    return res.status(403).json({ success: false, message: "Forbidden: Admin access only" });
  }
  next();
}

// GET /api/nfc/status - Check NFC status & admin permissions
router.get("/status", requireAuth, (req, res) => {
  const isAdmin = req.auth && (req.auth.role === "admin" || req.auth.role === "super_admin");
  res.json({
    available: true,
    mode: "keyboard-wedge",
    isAdmin,
    role: req.auth ? req.auth.role : null,
    userId: req.auth ? req.auth.userId : null
  });
});

// GET /api/nfc/people - Fetch students or teachers for NFC programming
router.get("/people", requireAuth, async (req, res) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    const type = req.query.type === "teacher" ? "teacher" : "student";
    const q = (req.query.q || "").trim();

    let people = [];

    if (type === "teacher") {
      let sql = `
        SELECT 
          t.id,
          t.user_id,
          t.school_id,
          t.employee_number AS registration_number,
          t.rfid_tag,
          COALESCE(t.phone, u.phone) AS phone,
          t.specialization,
          t.speciality,
          u.first_name,
          u.last_name,
          u.email,
          u.gender,
          u.photo,
          u.is_active
        FROM teachers t
        INNER JOIN users u ON u.id = t.user_id
        WHERE (t.school_id = ? OR ? IS NULL)
      `;
      const params = [schoolId, schoolId];

      if (q) {
        sql += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR t.employee_number LIKE ? OR t.rfid_tag LIKE ?)`;
        const wildcard = `%${q}%`;
        params.push(wildcard, wildcard, wildcard, wildcard);
      }

      sql += ` ORDER BY t.id DESC`;
      const rows = await query(sql, params);

      people = rows.map((r) => {
        const name = `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email || "بدون اسم";
        const reg = r.registration_number ? String(r.registration_number) : "";
        const rfid = r.rfid_tag ? String(r.rfid_tag) : "";
        return {
          id: r.id,
          user_id: r.user_id,
          name: name,
          first_name: r.first_name || "",
          last_name: r.last_name || "",
          reg: reg,
          rfid: rfid,
          phone: r.phone || "",
          formation: r.specialization || r.speciality || "أستاذ",
          photo: r.photo || "",
          gender: r.gender || "male",
          role: "teacher",
          is_active: r.is_active,
          is_match: Boolean(rfid && reg && rfid.toLowerCase() === reg.toLowerCase())
        };
      });
    } else {
      let sql = `
        SELECT 
          s.id,
          s.user_id,
          s.school_id,
          s.registration_number,
          s.rfid_tag,
          s.parent_phone,
          s.parent_name,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.gender,
          u.photo,
          u.is_active,
          f.title AS formation_title
        FROM students s
        INNER JOIN users u ON u.id = s.user_id
        LEFT JOIN formations f ON f.id = s.formation_id
        WHERE (s.school_id = ? OR ? IS NULL)
      `;
      const params = [schoolId, schoolId];

      if (q) {
        sql += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR s.registration_number LIKE ? OR s.rfid_tag LIKE ?)`;
        const wildcard = `%${q}%`;
        params.push(wildcard, wildcard, wildcard, wildcard);
      }

      sql += ` ORDER BY s.id DESC`;
      const rows = await query(sql, params);

      people = rows.map((r) => {
        const name = `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email || "بدون اسم";
        const reg = r.registration_number ? String(r.registration_number) : "";
        const rfid = r.rfid_tag ? String(r.rfid_tag) : "";
        return {
          id: r.id,
          user_id: r.user_id,
          name: name,
          first_name: r.first_name || "",
          last_name: r.last_name || "",
          reg: reg,
          rfid: rfid,
          phone: r.parent_phone || r.phone || "",
          formation: r.formation_title || "طالب",
          photo: r.photo || "",
          gender: r.gender || "male",
          role: "student",
          is_active: r.is_active,
          is_match: Boolean(rfid && reg && rfid.toLowerCase() === reg.toLowerCase())
        };
      });
    }

    res.json({ success: true, count: people.length, data: people, school_id: schoolId });
  } catch (e) {
    console.error("Error in /api/nfc/people:", e);
    res.status(500).json({ success: false, message: e.message, data: [] });
  }
});

// POST /api/nfc/link - Link RFID tag UID to student or teacher (ADMIN ONLY)
router.post("/link", requireAuth, requireAdmin, async (req, res) => {
  const { student_id, rfid_uid, person_type } = req.body;
  if (!student_id) return res.status(400).json({ success: false, message: "ID الشخص مطلوب" });

  try {
    const uid = (rfid_uid || "").trim() || null;
    if (person_type === "teacher") {
      await query("UPDATE teachers SET rfid_tag = ? WHERE id = ?", [uid, student_id]);
    } else {
      await query("UPDATE students SET rfid_tag = ? WHERE id = ?", [uid, student_id]);
    }
    res.json({
      success: true,
      message: uid ? `تم ربط البطاقة بنجاح: ${uid}` : "تم إلغاء ربط البطاقة بنجاح",
      rfid_tag: uid
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/nfc/sync-reg - Set rfid_tag to equal registration_number (ADMIN ONLY)
router.post("/sync-reg", requireAuth, requireAdmin, async (req, res) => {
  const { student_id, person_type } = req.body;
  if (!student_id) return res.status(400).json({ success: false, message: "ID الشخص مطلوب" });

  try {
    if (person_type === "teacher") {
      const teachers = await query("SELECT employee_number FROM teachers WHERE id = ?", [student_id]);
      if (!teachers.length) return res.status(404).json({ success: false, message: "لم يتم العثور على الأستاذ" });
      const reg = teachers[0].employee_number;
      if (!reg) return res.status(400).json({ success: false, message: "الأستاذ ليس لديه رقم وظيفي" });
      await query("UPDATE teachers SET rfid_tag = ? WHERE id = ?", [reg, student_id]);
      res.json({
        success: true,
        message: `تمت مطابقة معرّف البطاقة مع الرقم الوظيفي (${reg}) بنجاح`,
        rfid_tag: reg
      });
    } else {
      const students = await query("SELECT registration_number FROM students WHERE id = ?", [student_id]);
      if (!students.length) return res.status(404).json({ success: false, message: "لم يتم العثور على الطالب" });
      const reg = students[0].registration_number;
      if (!reg) return res.status(400).json({ success: false, message: "الطالب ليس لديه رقم تسجيل" });
      await query("UPDATE students SET rfid_tag = ? WHERE id = ?", [reg, student_id]);
      res.json({
        success: true,
        message: `تمت مطابقة معرّف البطاقة مع رقم التسجيل (${reg}) بنجاح`,
        rfid_tag: reg
      });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/nfc/bulk-sync - Set rfid_tag = registration_number for all students or teachers in school
router.post("/bulk-sync", requireAuth, requireAdmin, async (req, res) => {
  try {
    const schoolId = await getSchoolId(req.auth.userId);
    const { person_type, only_empty } = req.body;

    let updatedCount = 0;
    if (person_type === "teacher") {
      const condition = only_empty
        ? "WHERE (rfid_tag IS NULL OR rfid_tag = '') AND employee_number IS NOT NULL AND employee_number != '' AND (school_id = ? OR ? IS NULL)"
        : "WHERE employee_number IS NOT NULL AND employee_number != '' AND (school_id = ? OR ? IS NULL)";
      const result = await query(
        `UPDATE teachers SET rfid_tag = employee_number ${condition}`,
        [schoolId, schoolId]
      );
      updatedCount = result.affectedRows || 0;
    } else {
      const condition = only_empty
        ? "WHERE (rfid_tag IS NULL OR rfid_tag = '') AND registration_number IS NOT NULL AND registration_number != '' AND (school_id = ? OR ? IS NULL)"
        : "WHERE registration_number IS NOT NULL AND registration_number != '' AND (school_id = ? OR ? IS NULL)";
      const result = await query(
        `UPDATE students SET rfid_tag = registration_number ${condition}`,
        [schoolId, schoolId]
      );
      updatedCount = result.affectedRows || 0;
    }

    res.json({
      success: true,
      message: `تمت مطابقة رقم التسجيل لـ ${updatedCount} سجل بنجاح`,
      updated_count: updatedCount
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/nfc/lookup - Lookup person by RFID tag or registration number
router.post("/lookup", requireAuth, async (req, res) => {
  const uid = (req.body.rfid_uid || "").trim();
  if (!uid) return res.status(400).json({ success: false, message: "معرّف البطاقة أو رقم التسجيل مطلوب" });

  try {
    const students = await query(
      `
      SELECT s.id, u.first_name, u.last_name, s.registration_number, s.rfid_tag, u.photo, f.title AS formation_title
      FROM students s
      INNER JOIN users u ON u.id = s.user_id
      LEFT JOIN formations f ON f.id = s.formation_id
      WHERE s.rfid_tag = ? OR s.registration_number = ?
      LIMIT 1
    `,
      [uid, uid]
    );

    if (students.length) {
      return res.json({
        success: true,
        type: "student",
        data: {
          id: students[0].id,
          name: `${students[0].first_name || ""} ${students[0].last_name || ""}`.trim(),
          registration_number: students[0].registration_number,
          rfid_tag: students[0].rfid_tag,
          formation: students[0].formation_title || "طالب",
          photo: students[0].photo
        }
      });
    }

    const teachers = await query(
      `
      SELECT t.id, u.first_name, u.last_name, t.employee_number, t.rfid_tag, u.photo, t.specialization
      FROM teachers t
      INNER JOIN users u ON u.id = t.user_id
      WHERE t.rfid_tag = ? OR t.employee_number = ?
      LIMIT 1
    `,
      [uid, uid]
    );

    if (teachers.length) {
      return res.json({
        success: true,
        type: "teacher",
        data: {
          id: teachers[0].id,
          name: `${teachers[0].first_name || ""} ${teachers[0].last_name || ""}`.trim(),
          registration_number: teachers[0].employee_number,
          rfid_tag: teachers[0].rfid_tag,
          formation: teachers[0].specialization || "أستاذ",
          photo: teachers[0].photo
        }
      });
    }

    res.json({ success: false, message: "لم يتم العثور على أي سجل مطابق لهذا المعرّف أو رقم التسجيل" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;