import pool from '../config/db.js';

/**
 * Validates if the requesting user has access to a specific classroom data.
 * 
 * --- ACCESS LAYERS ---
 * 1. Global Admin Override: Admins, principals, and HR roles bypass all checks.
 * 2. Teacher Mapping: Matches user IDs to institutional staff records.
 * 3. Role-Based Permissions: Distinguishes between 'mark' (Class Teacher) and 'view' access.
 */
const verifyClassroomAccess = async (user, classroomId, requiredAccess = 'view', academic_year_id = null) => {
    if (!user) return { hasAccess: false, teacherId: null };
    
    // --- GLOBAL ADMINISTRATIVE BYPASS ---
    if (['admin', 'principal', 'hr'].includes(user.role?.toLowerCase())) {
        return { hasAccess: true, teacherId: user.id };
    }
    
    if (user.role === 'teacher' || user.userType === 'staff') {
        const teacherId = user.id;

        // 1. Check Year-Specific Mapping (Priority)
        if (academic_year_id && academic_year_id !== 'null') {
            const [mentorship] = await pool.query(
                "SELECT id FROM classroom_mentorship WHERE classroom_id = ? AND academic_year_id = ? AND teacher_id = ?",
                [classroomId, academic_year_id, teacherId]
            );
            if (mentorship.length > 0) return { hasAccess: true, teacherId };
        }
        
        // 2. Fallback to Legacy Column
        if (requiredAccess === 'mark') {
            const [isClassTeacher] = await pool.query(
                "SELECT id FROM classrooms WHERE id = ? AND class_teacher_id = ?",
                [classroomId, teacherId]
            );
            return { hasAccess: isClassTeacher.length > 0, teacherId };
        } else {
            const [assignment] = await pool.query(
                `SELECT DISTINCT c.id 
                 FROM classrooms c
                 LEFT JOIN class_subjects cs ON cs.classroom_id = c.id
                 WHERE c.id = ? AND (c.class_teacher_id = ? OR cs.teacher_id = ?)`,
                [classroomId, teacherId, teacherId]
            );
            return { hasAccess: assignment.length > 0, teacherId };
        }
    }
    
    return { hasAccess: false, teacherId: null };
};

export const getStudentAttendance = async (req, res) => {
    try {
        const { classroom_id, academic_year_id, date = new Date().toISOString().split('T')[0] } = req.query;
        
        let yearId = academic_year_id;
        if (!yearId) {
            const [[activeYear]] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
            yearId = activeYear?.id;
        }

        if (!yearId) {
            return res.status(400).json({ error: "Academic Year ID is required for synchronization" });
        }

        // --- RBAC Ownership Check ---
        // For administrative roles, classroom_id is optional to allow for global oversight.
        const isSpecialRole = ['admin', 'principal', 'hr'].includes(req.user.role?.toLowerCase());
        if (!classroom_id && !isSpecialRole) {
            return res.status(400).json({ error: "Classroom ID is required" });
        }

        if (classroom_id) {
            const { hasAccess } = await verifyClassroomAccess(req.user, classroom_id, 'view', academic_year_id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access Denied: You are not assigned to this classroom." });
            }
        }
        // ----------------------------

        let query = `
            SELECT 
                se.student_id, 
                se.classroom_id,
                TRIM(CONCAT(s.last_name, ' ', s.first_name, ' ', IFNULL(s.middle_name, ''))) as student_name, 
                s.student_id_no,
                se.roll_number, 
                c.class_name, 
                c.section,
                p.father_name,
                p.father_mobile,
                st.full_name as teacher_name,
                sa.id as attendance_id,
                COALESCE(sa.status, 'not marked') as status,
                sa.remarks,
                sa.date,
                sa.is_locked,
                DATE_FORMAT(s.dob, '%d/%m/%Y') as dob,
                s.residential_address as address,
                CASE 
                    WHEN s.doc_passport_photo IS NOT NULL THEN 
                        CONCAT('/', REPLACE(REPLACE(s.doc_passport_photo, '\\\\', '/'), '//', '/'))
                    ELSE NULL 
                END as student_photo
            FROM student_enrollments se
            JOIN students s ON se.student_id = s.id
            JOIN classrooms c ON se.classroom_id = c.id
            LEFT JOIN parents p ON s.id = p.student_id
            LEFT JOIN classroom_mentorship cm ON c.id = cm.classroom_id AND cm.academic_year_id = ?
            LEFT JOIN staff st ON COALESCE(cm.teacher_id, c.class_teacher_id) = st.id
            LEFT JOIN student_attendance sa ON se.student_id = sa.student_id AND sa.date = ? AND sa.academic_year_id = ?
        `;
        
        const queryParams = [yearId, date, yearId];
        if (classroom_id) {
            query += ` WHERE se.classroom_id = ? AND se.academic_year_id = ?`;
            queryParams.push(classroom_id, yearId);
        } else {
            query += ` WHERE se.academic_year_id = ?`;
            queryParams.push(yearId);
        }

        query += ` ORDER BY c.class_name ASC, se.roll_number ASC, student_name ASC`;
        
        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStaffAttendance = async (req, res) => {
    try {
        if (!req.user || !['admin', 'principal', 'hr'].includes(req.user.role?.toLowerCase())) {
            return res.status(403).json({ error: "Access Denied: Only administrative staff can view the staff attendance ledger." });
        }
        
        const { date = new Date().toISOString().split('T')[0] } = req.query;

        let query = `
            SELECT 
                s.id as staff_id, 
                s.employee_id,
                s.full_name, 
                s.department, 
                s.designation, 
                s.staff_type,
                r.role_name,
                sa.id as attendance_id,
                COALESCE(sa.status, CASE WHEN att.punch_in_time IS NOT NULL THEN 'present' ELSE 'not marked' END) as status,
                sa.check_in_time,
                sa.check_out_time,
                sa.working_hours,
                sa.remarks,
                sa.date,
                sa.is_locked,
                -- Self-punch data
                att.punch_in_time as self_punch_in,
                att.punch_out_time as self_punch_out,
                att.punch_in_method,
                att.punch_out_method,
                att.device_type,
                att.is_late as self_is_late
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
            LEFT JOIN staff_attendance sa ON s.id = sa.staff_id AND sa.date = ?
            LEFT JOIN attendances att ON s.id = att.user_id AND att.user_type = 'staff' AND att.date = ?
            WHERE s.status = 'active'
            ORDER BY s.full_name ASC
        `;

        const [rows] = await pool.query(query, [date, date]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markStudentAttendance = async (req, res) => {
    try {
        const { classroom_id, date, academic_year_id, attendance_data } = req.body; 
        
        // --- RBAC Ownership Check (Mark Access Required) ---
        const { hasAccess, teacherId } = await verifyClassroomAccess(req.user, classroom_id, 'mark', academic_year_id);
        if (!hasAccess) {
            return res.status(403).json({ error: "Access Denied: You are not authorized to mark attendance for this class." });
        }
        
        // Use the current logged-in user's mapped institutional teacher/staff ID as 'marked_by'
        const markerId = teacherId || req.user.id; 

        // --- Lock Check ---
        const [lockCheck] = await pool.query(
            "SELECT is_locked FROM student_attendance WHERE classroom_id = ? AND date = ? LIMIT 1",
            [classroom_id, date]
        );
        
        if (lockCheck.length > 0 && lockCheck[0].is_locked === 1) {
            return res.status(403).json({ error: "Access Denied: Attendance for this date is securely locked and cannot be modified." });
        }

        for (const record of attendance_data) {
            await pool.query(
                `INSERT INTO student_attendance (student_id, classroom_id, marked_by, status, date, academic_year_id, remarks)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), marked_by = VALUES(marked_by)`,
                [record.student_id, classroom_id, markerId, record.status, date, academic_year_id, record.remarks]
            );
        }
        
        res.json({ message: 'Attendance processed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const lockStudentAttendance = async (req, res) => {
    try {
        const { classroom_id, date } = req.body; 
        
        // --- RBAC Ownership Check (Mark/Lock Access Required) ---
        const { hasAccess } = await verifyClassroomAccess(req.user, classroom_id, 'mark');
        if (!hasAccess) {
            return res.status(403).json({ error: "Access Denied: Only the designated Class Teacher can lock the student attendance register." });
        }
        // ----------------------------
        
        await pool.query(
            "UPDATE student_attendance SET is_locked = 1 WHERE classroom_id = ? AND date = ?",
            [classroom_id, date]
        );
        
        res.json({ message: 'Attendance register securely locked' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markStaffAttendance = async (req, res) => {
    try {
        const { date, attendance_data } = req.body; 
        
        if (!req.user || !['admin', 'principal', 'hr'].includes(req.user.role?.toLowerCase())) {
            return res.status(403).json({ error: "Access Denied: Only administrative staff are authorized to mark staff attendance." });
        }
        for (const record of attendance_data) {
            await pool.query(
                `INSERT INTO staff_attendance (staff_id, status, date, remarks, check_in_time, check_out_time, working_hours)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    status = VALUES(status), 
                    remarks = VALUES(remarks),
                    check_in_time = COALESCE(VALUES(check_in_time), check_in_time),
                    check_out_time = COALESCE(VALUES(check_out_time), check_out_time),
                    working_hours = COALESCE(VALUES(working_hours), working_hours)`,
                [record.staff_id, record.status, date, record.remarks, record.check_in_time || null, record.check_out_time || null, record.working_hours || null]
            );
        }
        
        res.json({ message: 'Staff attendance processed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const lockStaffAttendance = async (req, res) => {
    try {
        const { date } = req.body;
        
        if (!req.user || !['admin', 'principal', 'hr'].includes(req.user.role?.toLowerCase())) {
            return res.status(403).json({ error: "Access Denied: Only administrative staff are authorized to lock staff attendance." });
        }
        
        await pool.query(
            "UPDATE staff_attendance SET is_locked = 1 WHERE date = ?",
            [date]
        );
        
        res.json({ message: 'Staff attendance register securely locked' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStudentAttendanceByClassroom = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        
        // --- RBAC Ownership Check ---
        const { hasAccess } = await verifyClassroomAccess(req.user, classroom_id);
        if (!hasAccess) {
            return res.status(403).json({ error: "Access Denied: You cannot view attendance reports for a classroom you do not own." });
        }
        // ----------------------------
        
        let { academic_year_id } = req.query;
        
        if (!academic_year_id || academic_year_id === 'undefined') {
            const [[classroom]] = await pool.query("SELECT academic_year_id FROM classrooms WHERE id = ?", [classroom_id]);
            academic_year_id = classroom?.academic_year_id;
            
            // --- SECONDARY FALLBACK: GET CURRENT ACTIVE YEAR ---
            if (!academic_year_id) {
                const [[activeYear]] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
                academic_year_id = activeYear?.id;
            }
        }
        
        if (!academic_year_id) {
            return res.status(400).json({ error: "Academic Year not resolved. Please ensure an active academic year is configured in the system." });
        }
        // --------------------------------------------

        const query = `
            SELECT sa.*, TRIM(CONCAT(s.first_name, ' ', IFNULL(s.middle_name, ''), ' ', s.last_name)) as student_name 
            FROM student_attendance sa
            JOIN students s ON sa.student_id = s.id
            WHERE sa.classroom_id = ? AND sa.academic_year_id = ?
        `;
        const [rows] = await pool.query(query, [classroom_id, academic_year_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getAttendanceStats = async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0], academic_year_id } = req.query;
        
        if (!academic_year_id) {
            return res.status(400).json({ error: "Academic Year ID is required for accurate statistics" });
        }

        if (!req.user || !['admin', 'principal', 'hr', 'teacher'].includes(req.user.role?.toLowerCase())) {
            return res.status(403).json({ error: "Access Denied: You are not authorized to view institutional attendance statistics." });
        }
        // Student Totals & Today Stats
        const [studentTotalRows] = await pool.query(`SELECT COUNT(*) as count FROM student_enrollments WHERE academic_year_id = ?`, [academic_year_id]);
        const [studentToday] = await pool.query(
            `SELECT status, COUNT(*) as count FROM student_attendance WHERE date = ? AND academic_year_id = ? GROUP BY status`, [date, academic_year_id]
        );
        
        // Staff Totals & Today Stats (Exclude admin)
        const [staffTotalRows] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
            WHERE s.status = 'active' AND LOWER(r.role_name) != 'admin'
        `);
        const [staffToday] = await pool.query(`
            SELECT sa.status, COUNT(DISTINCT sa.staff_id) as count 
            FROM staff_attendance sa
            JOIN staff s ON sa.staff_id = s.id
            LEFT JOIN roles r ON s.role_id = r.id
            WHERE sa.date = ? AND LOWER(r.role_name) != 'admin'
            GROUP BY sa.status
        `, [date]);
        
        // Monthly Trends (Last 15 marks across students)
        const [trends] = await pool.query(
            `SELECT date, status, COUNT(*) as count FROM student_attendance 
             WHERE date >= DATE_SUB(?, INTERVAL 30 DAY) AND academic_year_id = ?
             GROUP BY date, status ORDER BY date ASC`, [date, academic_year_id]
        );

        res.json({
            today: {
                students: {
                    total: studentTotalRows[0].count,
                    breakdown: studentToday
                },
                staff: {
                    total: staffTotalRows[0].count,
                    breakdown: staffToday
                }
            },
            trends: trends
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateAttendanceRecord = async (req, res) => {
    try {
        if (!req.user || !['admin', 'principal', 'hr'].includes(req.user.role?.toLowerCase())) {
            return res.status(403).json({ error: "Access Denied: Only administrative staff can amend attendance records." });
        }
        
        let { type, status, remarks, date, academic_year_id, student_id, staff_id, classroom_id } = req.body; 
        const markerId = req.user.id;
        
        if (type === 'student') {
            // Attempt to retrieve classroom_id from enrollment if missing (Fail-safe for global admin views)
            if (student_id && academic_year_id && !classroom_id) {
                const [[enrollment]] = await pool.query(
                    "SELECT classroom_id FROM student_enrollments WHERE student_id = ? AND academic_year_id = ? LIMIT 1",
                    [student_id, academic_year_id]
                );
                if (enrollment) classroom_id = enrollment.classroom_id;
            }

            if (!student_id || !classroom_id || !academic_year_id || !date) {
                return res.status(400).json({ error: "Missing required student parameters (classroom_id is required)" });
            }
            await pool.query(
                `INSERT INTO student_attendance (student_id, classroom_id, marked_by, status, date, academic_year_id, remarks)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), marked_by = VALUES(marked_by)`,
                [student_id, classroom_id, markerId, status, date, academic_year_id, remarks]
            );
        } else {
            if (!staff_id || !date) {
                return res.status(400).json({ error: "Missing required staff parameters for adjustment" });
            }
            const { check_in_time, check_out_time } = req.body;
            await pool.query(
                `INSERT INTO staff_attendance (staff_id, status, date, remarks, check_in_time, check_out_time)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    status = VALUES(status), 
                    remarks = VALUES(remarks),
                    check_in_time = COALESCE(VALUES(check_in_time), check_in_time),
                    check_out_time = COALESCE(VALUES(check_out_time), check_out_time)`,
                [staff_id, status, date, remarks, check_in_time || null, check_out_time || null]
            );
        }
        
        res.json({ message: 'Attendance record adjusted successfully', status, remarks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStudentAttendanceHistory = async (req, res) => {
    try {
        const { student_id, academic_year_id } = req.query;
        if (!student_id) {
            return res.status(400).json({ error: "student_id is required" });
        }
        let query = `SELECT * FROM student_attendance WHERE student_id = ?`;
        const params = [student_id];
        if (academic_year_id) {
            query += ` AND academic_year_id = ?`;
            params.push(academic_year_id);
        }
        query += ` ORDER BY date ASC`;
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStaffAttendanceHistory = async (req, res) => {
    try {
        const { staff_id } = req.query;
        if (!staff_id) {
            return res.status(400).json({ error: "staff_id is required" });
        }
        let query = `SELECT * FROM staff_attendance WHERE staff_id = ?`;
        const params = [staff_id];
        query += ` ORDER BY date ASC`;
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

