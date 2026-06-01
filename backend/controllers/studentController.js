import db from '../config/db.js';

const GRADE_SEQUENCE = [
    'Nursery', 'Jr.Kg', 'Sr.Kg',
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'
];

export const getAllStudents = async (req, res) => {
    try {
        let { academicYear, grade, classroom_id } = req.query;

        // If no academic year specified, default to the currently active one
        if (!academicYear) {
            const [activeYearRow] = await db.query(`SELECT year_name FROM academic_years WHERE is_active = 1 LIMIT 1`);
            if (activeYearRow.length > 0) {
                academicYear = activeYearRow[0].year_name;
            }
        }

        let query = `
            SELECT s.id, s.first_name, s.last_name, s.middle_name, s.student_id_no, s.gender, s.status,
                   s.gr_no, s.pen_no, s.admission_date, s.dob, s.enrollment_date, s.aadhar_no,
                   se.grade, se.roll_number, se.classroom_id, se.status as enrollment_status, 
                   p.father_name, p.father_mobile, p.father_email,
                   p.mother_name, p.mother_mobile,
                   c.class_name, c.section,
                   ay.year_name, 
                   CASE 
                       WHEN s.doc_passport_photo IS NOT NULL THEN 
                           CONCAT('/', REPLACE(REPLACE(s.doc_passport_photo, '\\\\', '/'), '//', '/'))
                       ELSE NULL 
                   END as doc_passport_photo
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id
            LEFT JOIN parents p ON s.id = p.student_id
            LEFT JOIN classrooms c ON se.classroom_id = c.id
            JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE s.status != 'alumni'
        `;

        let queryParams = [];
        if (academicYear) {
            if (isNaN(academicYear)) {
                query += ` AND ay.year_name = ?`;
            } else {
                query += ` AND se.academic_year_id = ?`;
            }
            queryParams.push(academicYear);
        }

        if (grade) {
            query += ` AND se.grade = ?`;
            queryParams.push(grade);
        }

        if (classroom_id) {
            query += ` AND se.classroom_id = ?`;
            queryParams.push(classroom_id);
        }

        const [rows] = await db.query(query, queryParams);
        res.json(rows.map(r => ({
            ...r,
            student_name: `${r.last_name || ''} ${r.first_name || ''} ${r.middle_name || ''}`.trim(),
            student_photo: r.doc_passport_photo
        })));
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT 
                s.*, 
                CONCAT(s.last_name, ' ', s.first_name, ' ', s.middle_name) as student_name,
                p.father_name, p.father_mobile, p.father_email, p.father_occupation,
                p.mother_name, p.mother_mobile, p.mother_occupation,
                (SELECT grade FROM student_enrollments se 
                 JOIN academic_years ay ON se.academic_year_id = ay.id 
                 WHERE se.student_id = s.id AND ay.is_active = 1 LIMIT 1) as current_grade,
                (SELECT roll_number FROM student_enrollments se 
                 JOIN academic_years ay ON se.academic_year_id = ay.id 
                 WHERE se.student_id = s.id AND ay.is_active = 1 LIMIT 1) as roll_number
            FROM students s
            LEFT JOIN parents p ON s.id = p.student_id
            WHERE s.id = ?
            LIMIT 1
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ error: "Student not found" });

        // Fetch enrollments
        const [enrollments] = await db.query(`
            SELECT se.*, ay.year_name 
            FROM student_enrollments se 
            JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE se.student_id = ?
            ORDER BY ay.year_name DESC
        `, [id]);

        res.json({
            ...rows[0],
            student_photo: rows[0].doc_passport_photo,
            enrollments
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch student details" });
    }
};

export const updateStudent = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const {
            first_name, last_name, middle_name, dob, gender, residential_address, taluka, district, state, pincode,
            aadhar_no, mother_tongue, pob, religion, caste, subcaste, status,
            father_name, father_mobile, father_email, father_occupation,
            mother_name, mother_mobile, mother_occupation, gr_no, pen_no,
            requires_transport, transport_range, pickup_point
        } = req.body;

        // 1. Update Students Table (Including global fallback transport fields)
        await connection.query(
            `UPDATE students SET 
                first_name = ?, last_name = ?, middle_name = ?, dob = ?, gender = ?, residential_address = ?, 
                taluka = ?, district = ?, state = ?, pincode = ?, 
                aadhar_no = ?, mother_tongue = ?, pob = ?, religion = ?, 
                caste = ?, subcaste = ?, status = ?,
                gr_no = ?, pen_no = ?,
                requires_transport = ?, transport_range = ?
             WHERE id = ?`,
            [
                first_name, last_name, middle_name, dob, gender, residential_address,
                taluka, district, state, pincode,
                aadhar_no, mother_tongue, pob, religion,
                caste, subcaste, status,
                gr_no, pen_no,
                requires_transport === undefined ? 0 : (requires_transport ? 1 : 0),
                transport_range || null,
                id
            ]
        );

        // 1.5 Update transport settings in active enrollment row
        const [activeYear] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
        if (activeYear.length > 0) {
            const activeYearId = activeYear[0].id;
            await connection.query(
                `UPDATE student_enrollments SET 
                    requires_transport = ?, 
                    transport_range = ?, 
                    pickup_point = ?
                 WHERE student_id = ? AND academic_year_id = ?`,
                [
                    requires_transport === undefined ? 0 : (requires_transport ? 1 : 0),
                    transport_range || null,
                    pickup_point || null,
                    id,
                    activeYearId
                ]
            );
        }

        // 2. Update Parents Table
        await connection.query(
            `UPDATE parents SET 
                father_name = ?, father_mobile = ?, father_email = ?, father_occupation = ?,
                mother_name = ?, mother_mobile = ?, mother_occupation = ?
             WHERE student_id = ?`,
            [
                father_name, father_mobile, father_email, father_occupation,
                mother_name, mother_mobile, mother_occupation, id
            ]
        );

        await connection.commit();
        res.json({ message: "Academic & Personal records updated successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Update Student Error:", error);
        res.status(500).json({ error: "Failed to update student academic records" });
    } finally {
        if (connection) connection.release();
    }
};

export const getStudentAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { academicYearId } = req.query;
        let query = `SELECT * FROM student_attendance WHERE student_id = ?`;
        let params = [id];
        if (academicYearId) {
            query += ` AND academic_year_id = ?`;
            params.push(academicYearId);
        }
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch attendance" });
    }
};

export const getStudentExams = async (req, res) => {
    try {
        const { id } = req.params;
        const { academicYearId } = req.query;
        let query = `
            SELECT ar.*, ay.year_name
            FROM academic_records ar
            JOIN academic_years ay ON ar.academic_year = ay.year_name
            WHERE ar.student_id = ?
        `;
        let params = [id];
        if (academicYearId) {
            query += ` AND ay.id = ?`;
            params.push(academicYearId);
        }
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch exams" });
    }
};

export const getStudentFees = async (req, res) => {
    try {
        const { id } = req.params;
        const { academicYearId } = req.query;

        // 1. Determine the academic year to sync with
        let activeYearId = academicYearId;
        if (!activeYearId) {
            const [enrollment] = await db.query(
                "SELECT academic_year_id FROM student_enrollments WHERE student_id = ? AND status = 'active' LIMIT 1",
                [id]
            );
            if (enrollment.length > 0) {
                activeYearId = enrollment[0].academic_year_id;
            } else {
                const [year] = await db.query(
                    "SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1"
                );
                if (year.length > 0) activeYearId = year[0].id;
            }
        }

        if (!activeYearId) {
            return res.status(400).json({ error: "Academic year could not be determined" });
        }

        // 2. Fetch student enrollment details (especially grade)
        const [enrollments] = await db.query(
            `SELECT se.grade, se.requires_transport, se.transport_range
             FROM student_enrollments se
             JOIN students s ON se.student_id = s.id
             WHERE se.student_id = ? AND se.academic_year_id = ?
             LIMIT 1`,
            [id, activeYearId]
        );

        // 3. Fetch base fee structure for that grade and academic year
        let feeStructureRow = null;
        if (enrollments.length > 0) {
            const [feeStructures] = await db.query(
                "SELECT * FROM fee_structure WHERE academic_year_id = ? AND grade = ? LIMIT 1",
                [activeYearId, enrollments[0].grade]
            );
            if (feeStructures.length > 0) {
                feeStructureRow = feeStructures[0];
            }
        }

        // 4. Fetch transport fees for that academic year
        const [transportFees] = await db.query(
            "SELECT * FROM transport_fees WHERE academic_year_id = ? LIMIT 1",
            [activeYearId]
        );
        const transportFeesRow = transportFees.length > 0 ? transportFees[0] : null;

        // 5. Fetch actual payment records
        const [payments] = await db.query(
            `SELECT p.*, ay.year_name
             FROM payments p
             LEFT JOIN academic_years ay ON p.academic_year_id = ay.id
             WHERE p.student_id = ? AND p.academic_year_id = ?
             ORDER BY p.payment_date DESC`,
            [id, activeYearId]
        );

        // 6. Calculate fee structure fields
        const requiresTransport = enrollments.length > 0 ? enrollments[0].requires_transport : 0;
        const transportRange = enrollments.length > 0 ? enrollments[0].transport_range : 'none';

        let admissionFee = 0;
        let tuitionFee = 0;
        let termFee = 0;
        let computerFee = 0;
        let otherFee = 0;

        if (feeStructureRow) {
            admissionFee = Number(feeStructureRow.admission_fee || 0);
            tuitionFee = Number(feeStructureRow.tuition_fee || 0);
            termFee = Number(feeStructureRow.term_fee || 0);
            computerFee = Number(feeStructureRow.computer_fee || 0);
            otherFee = Number(feeStructureRow.other_fee || 0);
        }

        let transportFee = 0;
        if (requiresTransport && transportFeesRow) {
            if (transportRange === '0-5km') transportFee = Number(transportFeesRow.transport_0_5km || 0);
            else if (transportRange === '5-7km') transportFee = Number(transportFeesRow.transport_5_7km || 0);
            else transportFee = Number(transportFeesRow.transport_above_7km || 0);
        }

        const discountTotal = payments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
        const billTotal = admissionFee + tuitionFee + termFee + computerFee + otherFee + transportFee - discountTotal;
        const paidTotal = payments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

        // Filter out auto-generated pending entries from visible payments to avoid double rendering
        const filteredPayments = payments.filter(
            p => !(p.status === 'pending' && p.remarks?.startsWith('Auto:') && (p.paid_amount === null || Number(p.paid_amount) === 0))
        );

        res.json({
            admission_fee: admissionFee,
            tuition_fee: tuitionFee,
            term_fee: termFee,
            transport_fee: transportFee,
            other_fee: computerFee + otherFee,
            discount_amount: discountTotal,
            bill_total: billTotal,
            paid_total: paidTotal,
            payments: filteredPayments
        });
    } catch (error) {
        console.error("Error in getStudentFees backend:", error);
        res.status(500).json({ error: "Failed to fetch fees" });
    }
};

export const addStudentFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { academic_year_id, fee_type, total_amount, paid_amount, status, payment_date, remarks } = req.body;

        const [result] = await db.query(
            `INSERT INTO payments (student_id, fee_type, total_payable, paid_amount, status, payment_date, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, fee_type, total_amount, paid_amount, status, payment_date || new Date(), remarks]
        );

        res.json({ message: "Fee record added successfully", id: result.insertId });
    } catch (error) {
        console.error("Error adding student fee:", error);
        res.status(500).json({ error: "Failed to add fee record" });
    }
};

// Bulk Promotion logic with Automated Sequential Transition
export const promoteStudents = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { studentIds, nextYearId } = req.body;

        if (!studentIds || !nextYearId || studentIds.length === 0) {
            return res.status(400).json({ error: "Missing required promotion data" });
        }

        // Check for duplicate promotions: verify if any selected student is already enrolled in the next academic year
        const [duplicates] = await connection.query(`
            SELECT DISTINCT s.id, CONCAT(s.last_name, ' ', s.first_name) as name
            FROM student_enrollments se
            JOIN students s ON se.student_id = s.id
            WHERE se.student_id IN (?) AND se.academic_year_id = ?
        `, [studentIds, nextYearId]);

        if (duplicates.length > 0) {
            const names = duplicates.map(d => d.name).join(', ');
            await connection.rollback();
            return res.status(400).json({ 
                error: `Duplicate Promotion: The following student(s) are already promoted to this academic year: ${names}` 
            });
        }

        // Ensure transport rates exist for the next academic year
        const [nextRates] = await connection.query(
            `SELECT id FROM transport_fees WHERE academic_year_id = ?`,
            [nextYearId]
        );
        if (nextRates.length === 0) {
            const [lastRates] = await connection.query(
                `SELECT transport_0_5km, transport_5_7km, transport_above_7km 
                 FROM transport_fees 
                 ORDER BY academic_year_id DESC LIMIT 1`
            );
            if (lastRates.length > 0) {
                await connection.query(
                    `INSERT INTO transport_fees (academic_year_id, transport_0_5km, transport_5_7km, transport_above_7km) 
                     VALUES (?, ?, ?, ?)`,
                    [nextYearId, lastRates[0].transport_0_5km, lastRates[0].transport_5_7km, lastRates[0].transport_above_7km]
                );
            }
        }

        for (const id of studentIds) {
            // 1. Resolve current grade for the student
            const [enrolls] = await connection.query(`
                SELECT se.grade, ay.year_name 
                FROM student_enrollments se 
                JOIN academic_years ay ON se.academic_year_id = ay.id
                WHERE se.student_id = ? AND se.status = 'active'
                ORDER BY ay.year_name DESC LIMIT 1
            `, [id]);

            if (enrolls.length === 0) continue;

            const currentGrade = enrolls[0].grade;
            const currentIndex = GRADE_SEQUENCE.indexOf(currentGrade);

            // 2. Archive 10th Grade students to Alumni
            if (currentGrade === '10th' || currentIndex === -1) {
                // Move to Alumni with standard exit reason
                const [student] = await connection.query(`
                    SELECT s.*, p.father_name, p.mother_name, p.father_mobile,
                    (SELECT grade FROM student_enrollments WHERE student_id = s.id ORDER BY academic_year_id ASC LIMIT 1) as admitted_grade
                    FROM students s 
                    LEFT JOIN parents p ON s.id = p.student_id 
                    WHERE s.id = ?`, [id]);
                const s = student[0];
                const leavingDate = new Date().toISOString().split('T')[0];
                const reason = currentGrade === '10th' ? "Completed 10th (Graduated)" : "Completed Institutional Cycle";

                await connection.query(`
                    INSERT INTO alumni (student_id, student_name, gender, dob, father_name, mother_name, leaving_date, exit_reason, final_grade, final_academic_year, gr_no, pen_no, last_address, last_mobile, doc_leaving_cert, admitted_grade, admission_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [id, s.student_name || `${s.last_name} ${s.first_name}`, s.gender, s.dob, s.father_name, s.mother_name, leavingDate, reason, currentGrade, enrolls[0].year_name, s.gr_no, s.pen_no, s.residential_address, s.father_mobile, s.doc_leaving_cert, s.admitted_grade, s.admission_date]);

                await connection.query(`UPDATE students SET status = 'alumni', is_blocked = 1 WHERE id = ?`, [id]);
                await connection.query(`UPDATE parents SET is_blocked = 1 WHERE student_id = ?`, [id]);
                await connection.query(`UPDATE student_enrollments SET status = 'graduated' WHERE student_id = ? AND status = 'active'`, [id]);
                continue;
            }

            // 3. Promote to Next Grade
            const nextGrade = GRADE_SEQUENCE[currentIndex + 1];

            // Resolve transport details from the previous session enrollment before promotion
            const [prevEnrollment] = await connection.query(
                `SELECT requires_transport, transport_range, pickup_point 
                 FROM student_enrollments 
                 WHERE student_id = ? AND status = 'active' LIMIT 1`,
                [id]
            );
            const prev = prevEnrollment[0] || { requires_transport: 0, transport_range: null, pickup_point: null };

            // Mark current enrollment as promoted
            await connection.query(
                `UPDATE student_enrollments SET status = 'promoted' WHERE student_id = ? AND status = 'active'`,
                [id]
            );

            // Resolve master classroom (Persistent across active/archived years)
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

            await connection.query(
                `INSERT INTO student_enrollments (student_id, classroom_id, grade, academic_year_id, status, requires_transport, transport_range, pickup_point) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
                [id, classroomId, nextGrade, nextYearId, prev.requires_transport, prev.transport_range, prev.pickup_point]
            );

            // Copy previous year transport assignments
            const [prevAssignments] = await connection.query(
                `SELECT vehicle_id, pickup_point, status FROM transport_assignments WHERE student_id = ? ORDER BY id DESC LIMIT 1`,
                [id]
            );
            
            if (prevAssignments.length > 0) {
                const ta = prevAssignments[0];
                await connection.query(
                    `INSERT INTO transport_assignments (vehicle_id, student_id, pickup_point, academic_year_id, status) VALUES (?, ?, ?, ?, ?)`,
                    [ta.vehicle_id, id, ta.pickup_point, nextYearId, ta.status]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Automated promotion cycle complete" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Promotion Logic Error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Duplicate Promotion: A student in this selection is already registered in the destination year." });
        }
        res.status(500).json({ error: "Bulk promotion cycle failed" });
    } finally {
        if (connection) connection.release();
    }
};

// Archive to Alumni
export const archiveToAlumni = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { leavingDate, reason } = req.body;

        const [student] = await connection.query(`
            SELECT s.*, p.father_name, p.mother_name, p.father_mobile,
            (SELECT grade FROM student_enrollments WHERE student_id = s.id ORDER BY academic_year_id ASC LIMIT 1) as admitted_grade
            FROM students s 
            LEFT JOIN parents p ON s.id = p.student_id
            WHERE s.id = ?
        `, [id]);

        if (student.length === 0) return res.status(404).json({ error: "Student not found" });
        const s = student[0];

        const [lastEnroll] = await connection.query(`
            SELECT se.grade, ay.year_name 
            FROM student_enrollments se 
            JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE se.student_id = ? ORDER BY ay.year_name DESC LIMIT 1
        `, [id]);

        // 1. Insert into alumni table
        await connection.query(`
            INSERT INTO alumni (student_id, student_name, gender, dob, father_name, mother_name, leaving_date, exit_reason, final_grade, final_academic_year, gr_no, pen_no, last_address, last_mobile, doc_leaving_cert, admitted_grade, admission_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, s.student_name || `${s.last_name} ${s.first_name}`, s.gender, s.dob, s.father_name, s.mother_name, leavingDate, reason, lastEnroll[0]?.grade, lastEnroll[0]?.year_name, s.gr_no, s.pen_no, s.residential_address, s.father_mobile, s.doc_leaving_cert, s.admitted_grade, s.admission_date]);

        // 2. Update status in students table and deactivate accounts
        await connection.query(`UPDATE students SET status = 'alumni', is_blocked = 1 WHERE id = ?`, [id]);
        await connection.query(`UPDATE parents SET is_blocked = 1 WHERE student_id = ?`, [id]);

        // 3. Mark enrollment as left/graduated
        await connection.query(`UPDATE student_enrollments SET status = ? WHERE student_id = ? AND status = 'active'`, [reason.toLowerCase().includes('10th') ? 'graduated' : 'left', id]);

        await connection.commit();
        res.json({ message: "Student transitioned to Alumni status" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: "Archival failed" });
    } finally {
        if (connection) connection.release();
    }
};

// Fetch Alumni
export const getAlumni = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM alumni ORDER BY leaving_date DESC`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch alumni" });
    }
};

// Delete Student Lifecycle
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        // Institutional Cleanup: Students and Parents tables are linked, and credentials reside within them.
        // We delete from students directly (cascades should handle related records if configured, otherwise manual cleanup here)
        const [result] = await db.query(`DELETE FROM students WHERE id = ?`, [id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "Record not found" });
        res.json({ message: "Student record and credentials Deleted successfully" });
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).json({ error: "Failed to Delete student record" });
    }
};

export const getMyStudent = async (req, res) => {
    try {
        const userId = req.user.id;
        const academicYearId = req.query.academicYearId;

        const [parents] = await db.query(
            "SELECT student_id FROM parents WHERE id = ?",
            [userId]
        );

        if (parents.length === 0 || !parents[0].student_id) {
            return res.status(404).json({ error: "No student linked to this parent account" });
        }

        const studentId = parents[0].student_id;

        const [rows] = await db.query(`
            SELECT 
                s.*, 
                CONCAT(s.last_name, ' ', s.first_name, ' ', s.middle_name) as student_name,
                p.father_name, p.father_mobile, p.father_email,
                se.grade as current_grade,
                se.classroom_id,
                se.roll_number
            FROM students s
            LEFT JOIN parents p ON s.id = p.student_id
            LEFT JOIN student_enrollments se ON s.id = se.student_id
            LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE s.id = ? AND (
                (${academicYearId ? 'ay.id = ?' : 'ay.is_active = 1'})
                OR (ay.id IS NULL)
            )
            ORDER BY ay.is_active DESC, ay.start_date DESC
            LIMIT 1
        `, academicYearId ? [studentId, academicYearId] : [studentId]);

        if (rows.length === 0) return res.status(404).json({ error: "Linked student record not found" });

        res.json(rows[0]);
    } catch (error) {
        console.error("getMyStudent error:", error);
        res.status(500).json({ error: "Failed to fetch linked student data" });
    }
};

export const getAllStudentLeaves = async (req, res) => {
    try {
        const { status, grade } = req.query;
        let query = `
            SELECT sl.*, 
                   CONCAT(s.last_name, ' ', s.first_name, ' ', s.middle_name) as student_name,
                   s.student_id_no, s.gr_no,
                   se.grade,
                   CASE 
                       WHEN s.doc_passport_photo IS NOT NULL THEN 
                           CONCAT('/', REPLACE(REPLACE(s.doc_passport_photo, '\\\\', '/'), '//', '/'))
                       ELSE NULL 
                   END as photo
            FROM student_leaves sl
            JOIN students s ON sl.student_id = s.id
            JOIN student_enrollments se ON s.id = se.student_id
            JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE ay.is_active = 1
        `;

        let params = [];
        if (status) {
            query += ` AND sl.status = ?`;
            params.push(status);
        }
        if (grade) {
            query += ` AND se.grade = ?`;
            params.push(grade);
        }

        query += ` ORDER BY sl.applied_at DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching student leaves:", error);
        res.status(500).json({ error: "Failed to fetch student leaves" });
    }
};

export const reviewStudentLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { status, remarks } = req.body;
        const userId = req.user.id;

        await db.query(
            `UPDATE student_leaves SET 
                status = ?, 
                review_remarks = ?, 
                reviewed_by = ?, 
                reviewed_at = NOW() 
             WHERE id = ?`,
            [status, remarks, userId, leaveId]
        );

        res.json({ message: `Leave application ${status} successfully` });
    } catch (error) {
        console.error("Error reviewing student leave:", error);
        res.status(500).json({ error: "Failed to review leave" });
    }
};

export const getStudentLeaves = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT * FROM student_leaves WHERE student_id = ? ORDER BY applied_at DESC`,
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch student leaves" });
    }
};

export const applyStudentLeave = async (req, res) => {
    try {
        const student_id = req.params.id || req.body.student_id;
        const { academic_year_id, leave_type, from_date, to_date, days, reason } = req.body;

        if (!student_id || !from_date || !to_date) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let academicYearId = academic_year_id;
        if (!academicYearId) {
            const [activeYearRow] = await db.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
            if (activeYearRow.length > 0) {
                academicYearId = activeYearRow[0].id;
            }
        }

        let finalDays = days;
        if (!finalDays) {
            const from = new Date(from_date);
            const to = new Date(to_date);
            const diffTime = Math.abs(to - from);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            finalDays = isNaN(diffDays) ? 1 : diffDays;
        }

        const [result] = await db.query(
            `INSERT INTO student_leaves (student_id, academic_year_id, leave_type, from_date, to_date, days, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [student_id, academicYearId, leave_type, from_date, to_date, finalDays, reason]
        );

        res.status(201).json({ message: "Leave application submitted successfully", id: result.insertId });
    } catch (error) {
        console.error("Apply student leave error:", error);
        res.status(500).json({ error: "Failed to submit leave application" });
    }
};

