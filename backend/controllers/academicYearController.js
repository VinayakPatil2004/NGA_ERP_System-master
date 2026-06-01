import db from '../config/db.js';

export const getAllYears = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM academic_years ORDER BY year_name DESC`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch academic years" });
    }
};

export const getActiveYear = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM academic_years WHERE is_active = 1 LIMIT 1`);
        if (rows.length === 0) return res.status(404).json({ error: "No active academic year found" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch active year" });
    }
};

export const addYear = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { yearName, startDate, endDate, isActive } = req.body;

        if (isActive) {
            await connection.query(`UPDATE academic_years SET is_active = 0`);
        }

        const [result] = await connection.query(
            `INSERT INTO academic_years (year_name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)`,
            [yearName, startDate, endDate, isActive ? 1 : 0]
        );
        const newYearId = result.insertId;

        // Auto-clone the latest transport rates to the new academic year
        const [lastRates] = await connection.query(
            `SELECT transport_0_5km, transport_5_7km, transport_above_7km 
             FROM transport_fees 
             ORDER BY academic_year_id DESC LIMIT 1`
        );
        if (lastRates.length > 0) {
            await connection.query(
                `INSERT INTO transport_fees (academic_year_id, transport_0_5km, transport_5_7km, transport_above_7km) 
                 VALUES (?, ?, ?, ?)`,
                [newYearId, lastRates[0].transport_0_5km, lastRates[0].transport_5_7km, lastRates[0].transport_above_7km]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Academic year added successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Add Year Error:", error);
        res.status(500).json({ error: "Failed to add academic year" });
    } finally {
        if (connection) connection.release();
    }
};

export const setActiveYear = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        // Reset all
        await connection.query(`UPDATE academic_years SET is_active = 0`);
        // Set new active
        await connection.query(`UPDATE academic_years SET is_active = 1 WHERE id = ?`, [id]);
        await connection.commit();
        res.json({ message: "Global session context updated" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: "Failed to set active year" });
    } finally {
        if (connection) connection.release();
    }
};

export const updateYear = async (req, res) => {
    try {
        const { id } = req.params;
        const { yearName, startDate, endDate } = req.body;
        await db.query(
            `UPDATE academic_years SET year_name = ?, start_date = ?, end_date = ? WHERE id = ?`,
            [yearName, startDate, endDate, id]
        );
        res.json({ message: "Academic session updated successfully" });
    } catch (error) {
        console.error("Update Year Error:", error);
        res.status(500).json({ error: "Institutional Logic: Update failed" });
    }
};

export const deleteYear = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevention: Check if active
        const [year] = await db.query(`SELECT is_active FROM academic_years WHERE id = ?`, [id]);
        if (year.length > 0 && year[0].is_active) {
            return res.status(400).json({ error: "Cannot Delete the active operational session." });
        }

        await db.query(`DELETE FROM academic_years WHERE id = ?`, [id]);
        res.json({ message: "Academic session Deleted from registry" });
    } catch (error) {
        console.error("Delete Year Error:", error);
        res.status(500).json({ error: "Institutional Logic: Deletion failed" });
    }
};

const GRADE_SEQUENCE = [
    'Nursery', 'Jr.Kg', 'Sr.Kg',
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'
];

export const promoteStudents = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { fromYearId, toYearId } = req.body;

        if (!fromYearId || !toYearId) {
            return res.status(400).json({ error: "Missing promotion context (From/To Academic Years)" });
        }

        // Fetch active students from the previous session registry
        const [students] = await connection.query(
            `SELECT student_id, grade FROM student_enrollments WHERE academic_year_id = ? AND status = 'active'`,
            [fromYearId]
        );

        // Ensure transport rates exist for the destination academic year
        const [nextRates] = await connection.query(
            `SELECT id FROM transport_fees WHERE academic_year_id = ?`,
            [toYearId]
        );
        if (nextRates.length === 0) {
            // Copy transport rates from the source academic year
            const [sourceRates] = await connection.query(
                `SELECT transport_0_5km, transport_5_7km, transport_above_7km 
                 FROM transport_fees 
                 WHERE academic_year_id = ? LIMIT 1`,
                [fromYearId]
            );
            
            const ratesToUse = sourceRates[0] || { transport_0_5km: 0, transport_5_7km: 0, transport_above_7km: 0 };
            
            await connection.query(
                `INSERT INTO transport_fees (academic_year_id, transport_0_5km, transport_5_7km, transport_above_7km) 
                 VALUES (?, ?, ?, ?)`,
                [toYearId, ratesToUse.transport_0_5km, ratesToUse.transport_5_7km, ratesToUse.transport_above_7km]
            );
        }

        for (const student of students) {
            // Safety check: verify student exists in the master students registry
            const [studentExist] = await connection.query(`SELECT id FROM students WHERE id = ?`, [student.student_id]);
            if (studentExist.length === 0) {
                console.warn(`Warning: Student ID ${student.student_id} exists in enrollments but not in master students registry. Skipping.`);
                continue;
            }

            const currentIndex = GRADE_SEQUENCE.indexOf(student.grade);

            // 1. Logic for Graduating Students (10th Grade)
            if (student.grade === '10th' || currentIndex === -1) {
                // Fetch student and parent data for alumni record
                const [studentData] = await connection.query(`
                    SELECT s.*, p.father_name, p.mother_name, p.father_mobile, ay.year_name,
                    (SELECT grade FROM student_enrollments WHERE student_id = s.id ORDER BY academic_year_id ASC LIMIT 1) as admitted_grade
                    FROM students s 
                    LEFT JOIN parents p ON s.id = p.student_id 
                    LEFT JOIN academic_years ay ON ay.id = ?
                    WHERE s.id = ?
                `, [fromYearId, student.student_id]);

                const s = studentData[0];
                if (!s) {
                    console.warn(`Warning: Student ID ${student.student_id} record not found during graduation query. Skipping.`);
                    continue;
                }
                const leavingDate = new Date().toISOString().split('T')[0];
                const reason = student.grade === '10th' ? "Completed 10th (Graduated)" : "Completed Institutional Cycle";

                // Insert into Alumni Registry
                await connection.query(`
                    INSERT INTO alumni (student_id, student_name, gender, dob, father_name, mother_name, leaving_date, exit_reason, final_grade, final_academic_year, gr_no, pen_no, last_address, last_mobile, doc_leaving_cert, admitted_grade, admission_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [student.student_id, s.student_name || `${s.last_name || ''} ${s.first_name || ''}`.trim() || 'Unknown Student', s.gender, s.dob, s.father_name, s.mother_name, leavingDate, reason, student.grade, s.year_name, s.gr_no, s.pen_no, s.residential_address, s.father_mobile, s.doc_leaving_cert, s.admitted_grade, s.admission_date]);

                // Update Master Record Status and Deactivate Accounts
                await connection.query(`UPDATE students SET status = 'alumni', is_blocked = 1 WHERE id = ?`, [student.student_id]);
                await connection.query(`UPDATE parents SET is_blocked = 1 WHERE student_id = ?`, [student.student_id]);
                // Finalize Enrollment status
                await connection.query(
                    `UPDATE student_enrollments SET status = 'graduated' 
                     WHERE student_id = ? AND academic_year_id = ?`,
                    [student.student_id, fromYearId]
                );
                continue;
            }

            // 2. Logic for Standard Sequential Promotion
            const nextGrade = GRADE_SEQUENCE[currentIndex + 1];

            if (nextGrade) {
                // Resolve master classroom (Persistent across years)
                const [classes] = await connection.query(`SELECT id FROM classrooms WHERE TRIM(class_name) = ? LIMIT 1`, [nextGrade]);
                let classroomId = classes[0]?.id;

                if (!classroomId) {
                    const [newClass] = await connection.query(
                        `INSERT INTO classrooms (class_name, grade_level, capacity, room_number, status) 
                         VALUES (?, ?, ?, ?, 'active')`,
                        [nextGrade, currentIndex + 1, 40, 'TBA']
                    );
                    classroomId = newClass.insertId;
                }

                // Resolve transport details from the previous session enrollment
                const [prevEnrollment] = await connection.query(
                    `SELECT requires_transport, transport_range, pickup_point 
                     FROM student_enrollments 
                     WHERE student_id = ? AND academic_year_id = ?`,
                    [student.student_id, fromYearId]
                );
                const prev = prevEnrollment[0] || { requires_transport: 0, transport_range: null, pickup_point: null };

                // Provision or resolve next session enrollment
                await connection.query(
                    `INSERT IGNORE INTO student_enrollments (student_id, classroom_id, grade, academic_year_id, status, requires_transport, transport_range, pickup_point) 
                     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
                    [student.student_id, classroomId, nextGrade, toYearId, prev.requires_transport, prev.transport_range, prev.pickup_point]
                );
                // Mark previous session enrollment as promoted
                await connection.query(
                    `UPDATE student_enrollments SET status = 'promoted' 
                     WHERE student_id = ? AND academic_year_id = ?`,
                    [student.student_id, fromYearId]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Global promotion architecture synchronized successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Global Promotion Error:", error);
        res.status(500).json({ error: "Institutional Logic: Global promotion synchronization failed" });
    } finally {
        if (connection) connection.release();
    }
};

export const getGlobalStats = async (req, res) => {
    try {
        const { yearId } = req.query;
        if (!yearId) return res.status(400).json({ error: "Year ID is required" });

        const [admissions] = await db.query(
            `SELECT COUNT(*) as count FROM students WHERE academic_year_id = ?`,
            [yearId]
        );

        const [enrollments] = await db.query(
            `SELECT COUNT(*) as count FROM student_enrollments WHERE academic_year_id = ?`,
            [yearId]
        );

        const [staff] = await db.query(
            `SELECT COUNT(*) as count FROM staff WHERE status = 'active'`
        );

        // Revenue collected TODAY across all fee types
        const [revenue] = await db.query(
            `SELECT SUM(paid_amount) as total 
             FROM payments 
             WHERE academic_year_id = ? AND DATE(payment_date) = CURDATE()`,
            [yearId]
        );

        const [classrooms] = await db.query(`SELECT COUNT(*) as count FROM classrooms WHERE status = 'active'`);

        res.json({
            admissions: admissions[0].count,
            students: enrollments[0].count,
            staff: staff[0].count,
            revenue: revenue[0].total || 0,
            classrooms: classrooms[0].count
        });
    } catch (error) {
        console.error("Global Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch global stats" });
    }
};

export const getDashboardChartsData = async (req, res) => {
    try {
        const { yearId } = req.query;
        if (!yearId) return res.status(400).json({ error: "Year ID is required" });

        // Use the exact same logic as Student Fee Management module
        const { getStudentFeeLedgerData } = await import('./FeesAndFinance/studentFeeController.js');
        const ledger = await getStudentFeeLedgerData(yearId);

        let totalCollected = 0;
        let totalPending = 0;
        let pendingStudentsCount = 0;

        ledger.forEach(student => {
            totalCollected += student.totalPaid;
            if (student.status === 'pending') {
                totalPending += (student.totalPayable - student.totalPaid);
                pendingStudentsCount++;
            }
        });

        const feeSummary = [
            { name: 'Collected', value: totalCollected },
            { name: 'Pending', value: totalPending }
        ];

        // 2. Enrollment Trend: Year-over-Year
        const [enrollmentData] = await db.query(
            `SELECT 
                ay.year_name, 
                COUNT(se.id) as students 
             FROM academic_years ay 
             LEFT JOIN student_enrollments se ON ay.id = se.academic_year_id 
             GROUP BY ay.id 
             ORDER BY ay.year_name ASC`
        );

        // 3. Gender Ratio
        const [genderData] = await db.query(
            `SELECT gender as name, COUNT(*) as value FROM students WHERE status = 'active' GROUP BY gender`
        );
        const genderRatio = genderData.map(d => ({ name: d.name || 'Unknown', value: d.value }));

        // 4. Department-wise Staff (Grouped by Category)
        const [deptData] = await db.query(
            `SELECT 
                CASE 
                    WHEN LOWER(r.role_name) = 'teacher' THEN 'Teaching Staff'
                    WHEN LOWER(r.role_name) IN ('hr', 'accountant', 'counsellor', 'librarian', 'principal') THEN 'Administrative Staff'
                    WHEN LOWER(r.role_name) IN ('aunty', 'canteen', 'security gaurd', 'bus driver') THEN 'Support Staff'
                    ELSE 'Other'
                END as name,
                COUNT(s.id) as value 
             FROM staff s 
             LEFT JOIN roles r ON s.role_id = r.id 
             WHERE s.status = 'active' AND LOWER(r.role_name) != 'admin'
             GROUP BY name`
        );
        const staffDepartment = deptData.map(d => ({ name: d.name, value: d.value }));

        // 5. Transport Ratio
        const [transportData] = await db.query(
            `SELECT IF(requires_transport=1, 'Used', 'Not Used') as name, COUNT(*) as value FROM students WHERE status='active' GROUP BY requires_transport`
        );
        const transportRatio = transportData;

        // 6. Fee Collection Month-wise
        const [monthFeeData] = await db.query(
            `SELECT DATE_FORMAT(payment_date, '%b') as name, SUM(paid_amount) as value 
             FROM payments 
             WHERE academic_year_id = ? AND payment_date IS NOT NULL
             GROUP BY name, MONTH(payment_date) 
             ORDER BY MONTH(payment_date)`,
            [yearId]
        );
        const feeCollectionMonthWise = monthFeeData.map(d => ({ name: d.name, value: Number(d.value || 0) }));

        // 7. Today's Attendance Overview
        const [studentAttData] = await db.query(
            `SELECT 
                COUNT(CASE WHEN status='present' THEN 1 END) as present, 
                COUNT(CASE WHEN status='absent' THEN 1 END) as absent 
             FROM student_attendance WHERE date = CURDATE() AND academic_year_id = ?`,
            [yearId]
        );
        const [staffAttData] = await db.query(
            `SELECT 
                COUNT(CASE WHEN status='present' THEN 1 END) as present, 
                COUNT(CASE WHEN status='absent' THEN 1 END) as absent 
             FROM staff_attendance WHERE date = CURDATE()`
        );
        const todayAttendance = [
            { name: 'Students', present: studentAttData[0]?.present || 0, absent: studentAttData[0]?.absent || 0 },
            { name: 'Staff', present: staffAttData[0]?.present || 0, absent: staffAttData[0]?.absent || 0 }
        ];

        // 8. Class-wise Attendance
        const [classAttData] = await db.query(
            `SELECT c.class_name as name, 
                COUNT(CASE WHEN sa.status='present' THEN 1 END) as present, 
                COUNT(CASE WHEN sa.status='absent' THEN 1 END) as absent 
             FROM student_attendance sa
             JOIN classrooms c ON sa.classroom_id = c.id
             WHERE sa.date = CURDATE() AND sa.academic_year_id = ?
             GROUP BY c.class_name
             ORDER BY c.class_name`,
            [yearId]
        );
        const classWiseAttendance = classAttData.map(d => ({ name: d.name, present: d.present, absent: d.absent }));

        res.json({
            feeSummary,
            pendingStudentsCount,
            enrollmentTrend: enrollmentData,
            genderRatio,
            staffDepartment,
            transportRatio,
            feeCollectionMonthWise,
            todayAttendance,
            classWiseAttendance
        });
    } catch (error) {
        console.error("Dashboard Charts Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard charts data" });
    }
};
