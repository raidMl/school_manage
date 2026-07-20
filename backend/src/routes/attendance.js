const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const requireAuth = require('../middleware/auth');

async function getSchoolId(userId) {
  const rows = await query(
    `SELECT s.id FROM schools s
     LEFT JOIN school_users su ON su.school_id = s.id
     WHERE s.admin_id = ? OR su.user_id = ?
     ORDER BY s.created_at DESC LIMIT 1`,
    [userId, userId]
  );
  return rows[0] ? rows[0].id : null;
}

// GET /api/attendance
// Fetch attendance for a group on a specific date (or just by date/type)
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { date, group_id, type } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const schoolId = await getSchoolId(req.auth.userId);

        let students = [];
        let teachers = [];
        let subject_name = req.query.subject_name || '';

        if (type === 'student' || !type) {
            if (group_id) {
                // Get students in the group
                const queryStr = `
                    SELECT s.id, u.first_name, u.last_name, u.photo, s.registration_number, s.rfid_tag,
                           COALESCE(a.status, 'pending') as status, a.scan_time, a.notes
                    FROM student_groups sg
                    JOIN students s ON sg.student_id = s.id
                    JOIN users u ON s.user_id = u.id
                    LEFT JOIN attendance a ON a.user_id = s.id 
                                           AND a.user_type = 'student' 
                                           AND a.date = ? 
                                           AND a.group_id = ?
                                           AND a.subject_name = ?
                    WHERE sg.group_id = ? AND u.is_active = 1 AND s.school_id = ?
                `;
                students = await query(queryStr, [date, group_id, subject_name, group_id, schoolId]);
            } else {
                // If no group_id, list all students in the school
                const queryStr = `
                    SELECT s.id, u.first_name, u.last_name, u.photo, s.registration_number, s.rfid_tag,
                           COALESCE(a.status, 'pending') as status, a.scan_time, a.notes
                    FROM students s
                    JOIN users u ON s.user_id = u.id
                    LEFT JOIN attendance a ON a.user_id = s.id 
                                           AND a.user_type = 'student' 
                                           AND a.date = ?
                                           AND a.subject_name = ?
                    WHERE u.is_active = 1 AND s.school_id = ?
                `;
                students = await query(queryStr, [date, subject_name, schoolId]);
            }
        }

        if (type === 'teacher' || !type) {
            const queryStr = `
                SELECT t.id, u.first_name, u.last_name, u.photo, t.employee_number, t.rfid_tag,
                       COALESCE(a.status, 'pending') as status, a.scan_time, a.notes
                FROM teachers t
                JOIN users u ON t.user_id = u.id
                LEFT JOIN attendance a ON a.user_id = t.id AND a.user_type = 'teacher' AND a.date = ? AND a.subject_name = ?
                WHERE u.is_active = 1 AND t.school_id = ?
            `;
            teachers = await query(queryStr, [date, subject_name, schoolId]);
        }

        let is_validated = false;
        if (group_id) {
            const valCheck = await query('SELECT id FROM attendance_validations WHERE group_id = ? AND date = ? AND subject_name = ?', [group_id, date, subject_name]);
            if (valCheck.length > 0) is_validated = true;
        }

        res.json({ students, teachers, is_validated });
    } catch (err) {
        next(err);
    }
});

// GET /api/attendance/subjects
// Fetch scheduled subjects for a group on a specific date based on the active weekly program
router.get('/subjects', requireAuth, async (req, res, next) => {
    try {
        const { group_id, date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'date is required' });
        }

        const schoolId = await getSchoolId(req.auth.userId);
        
        // Find active program
        const activeProg = await query(`SELECT id FROM weekly_programs WHERE school_id = ? AND status = 'active' LIMIT 1`, [schoolId]);
        if (activeProg.length === 0) {
            return res.json({ subjects: [] });
        }
        
        const programId = activeProg[0].id;
        
        const d = new Date(date);
        let dayOfWeek = d.getDay(); 
        if (dayOfWeek === 0) dayOfWeek = 7; 

        // Fetch subjects
        let subjectsQuery, queryArgs;
        if (group_id) {
            subjectsQuery = `
                SELECT DISTINCT wse.subject_name 
                FROM weekly_schedule_entries wse
                JOIN weekly_time_slots wts ON wse.slot_id = wts.id
                WHERE wts.program_id = ? AND wse.group_id = ? AND wse.day_of_week = ?
            `;
            queryArgs = [programId, group_id, dayOfWeek];
        } else {
            subjectsQuery = `
                SELECT DISTINCT wse.subject_name 
                FROM weekly_schedule_entries wse
                JOIN weekly_time_slots wts ON wse.slot_id = wts.id
                WHERE wts.program_id = ? AND wse.day_of_week = ?
            `;
            queryArgs = [programId, dayOfWeek];
        }

        const rows = await query(subjectsQuery, queryArgs);
        const subjects = rows.map(r => r.subject_name);

        res.json({ subjects });
    } catch (err) {
        next(err);
    }
});

// POST /api/attendance/manual
// Admin/Teacher manually toggles attendance
router.post('/manual', async (req, res, next) => {
    try {
        let { user_type, user_id, group_id, date, status, notes, subject_name } = req.body;
        subject_name = subject_name || '';

        if (!user_type || !user_id || !date || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Insert or update
        const queryStr = `
            INSERT INTO attendance (user_type, user_id, group_id, date, status, notes, subject_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes)
        `;
        
        await query(queryStr, [user_type, user_id, group_id || null, date, status, notes || null, subject_name]);

        res.json({ message: 'Attendance updated successfully' });
    } catch (err) {
        next(err);
    }
});

// POST /api/attendance/scan
// Automatic scanner endpoint (RFID or QR)
router.post('/scan', async (req, res, next) => {
    try {
        const { tag, date, group_id } = req.body;

        if (!tag || !date) {
            return res.status(400).json({ message: 'Tag and Date are required' });
        }

        // Find user by tag (check students first, then teachers)
        // Tag can match either rfid_tag or registration_number/employee_number
        let userType = 'student';
        let user = null;

        let students = await query(`
            SELECT s.*, u.first_name, u.last_name, u.photo 
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.rfid_tag = ? OR s.registration_number = ? LIMIT 1
        `, [tag, tag]);
        if (students.length > 0) {
            user = students[0];
        } else {
            let teachers = await query(`
                SELECT t.*, u.first_name, u.last_name, u.photo 
                FROM teachers t 
                JOIN users u ON t.user_id = u.id 
                WHERE t.rfid_tag = ? OR t.employee_number = ? LIMIT 1
            `, [tag, tag]);
            if (teachers.length > 0) {
                userType = 'teacher';
                user = teachers[0];
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found for the provided tag' });
        }

        // Insert attendance record
        const scanTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
        let subject_name = req.body.subject_name || '';
        
        const queryStr = `
            INSERT INTO attendance (user_type, user_id, group_id, date, status, scan_time, subject_name)
            VALUES (?, ?, ?, ?, 'present', ?, ?)
            ON DUPLICATE KEY UPDATE status = 'present', scan_time = VALUES(scan_time)
        `;
        
        await query(queryStr, [userType, user.id, group_id || null, date, scanTime, subject_name]);

        res.json({ 
            message: 'Scan successful',
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                type: userType,
                photo: user.photo
            }
        });

    } catch (err) {
        next(err);
    }
});

// POST /api/attendance/validate
// Admin validates the attendance for a group and date
router.post('/validate', async (req, res, next) => {
    try {
        let { group_id, date, admin_id, subject_name } = req.body;
        subject_name = subject_name || '';

        if (!group_id || !date || !admin_id) {
            return res.status(400).json({ message: 'group_id, date, and admin_id are required' });
        }

        const queryStr = `
            INSERT INTO attendance_validations (group_id, date, validated_by, subject_name)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE validated_by = VALUES(validated_by)
        `;
        
        await query(queryStr, [group_id, date, admin_id, subject_name]);

        res.json({ message: 'Attendance validated successfully' });
    } catch (err) {
        next(err);
    }
});

// POST /api/attendance/bulk
// Bulk update attendance statuses
router.post('/bulk', async (req, res, next) => {
    try {
        let { user_type, user_ids, group_id, date, status, subject_name } = req.body;
        subject_name = subject_name || '';

        if (!user_type || !user_ids || !Array.isArray(user_ids) || !date || !status) {
            return res.status(400).json({ message: 'Invalid bulk update payload' });
        }
        if (user_ids.length === 0) {
            return res.json({ message: 'No users provided' });
        }

        const values = [];
        const placeholders = user_ids.map(id => {
            values.push(user_type, id, group_id || null, date, status, subject_name);
            return '(?, ?, ?, ?, ?, ?)';
        }).join(',');

        const queryStr = `
            INSERT INTO attendance (user_type, user_id, group_id, date, status, subject_name)
            VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        `;

        await query(queryStr, values);

        res.json({ message: 'Bulk attendance updated successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
