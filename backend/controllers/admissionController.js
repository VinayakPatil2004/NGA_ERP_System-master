import db from '../config/db.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Note: This controller handles the institutional Admission Lifecycle.
 * It has been refactored to focus on "Direct Student Enrollment" for administrative use,
 * removing the public online admission process.
 */


/**
 * Helper: Synchronizes roll numbers for a specific classroom alphabetically.
 * Re-numbers all students in the class by LastName, FirstName, MiddleName.
 */
const recalculateRollNumbers = async (connection, classroomId, academicYearId) => {
    logger.info(`[REGISTRY] Synchronizing roll numbers for Classroom: ${classroomId}, Year: ${academicYearId}`);
    
    // 1. Fetch current roster ordered alphabetically by the requesting institution's standard
    const [students] = await connection.query(
        `SELECT se.id, s.last_name, s.first_name, s.middle_name 
         FROM student_enrollments se 
         JOIN students s ON se.student_id = s.id 
         WHERE se.classroom_id = ? AND se.academic_year_id = ? 
         ORDER BY s.last_name ASC, s.first_name ASC, s.middle_name ASC`,
        [classroomId, academicYearId]
    );

    // 2. Sequential update of roll numbers to ensure zero-collision integrity
    for (let i = 0; i < students.length; i++) {
        await connection.query(
            `UPDATE student_enrollments SET roll_number = ? WHERE id = ?`,
            [i + 1, students[i].id]
        );
    }
};

/**
 * Helper: Generates a unique institutional application number.
 */
const generateApplicationNo = async (connection) => {
    const year = new Date().getFullYear();
    // Registry Logic: Querying students table instead of deprecated admission_applications
    const [rows] = await connection.query(
        "SELECT application_no FROM students WHERE application_no LIKE ? ORDER BY id DESC LIMIT 1",
        [`NGA/ADM/${year}/%`]
    );
    
    let nextNum = 1;
    if (rows.length > 0) {
        const lastNo = rows[0].application_no;
        const parts = lastNo.split('/');
        const lastPart = parts[parts.length - 1];
        nextNum = parseInt(lastPart) + 1;
    }
    
    return `NGA/ADM/${year}/${nextNum.toString().padStart(4, '0')}`;
};

/**
 * STAFF ROUTE: Performs immediate enrollment for administrative entries.
 */
export const directEnrollStudent = async (req, res) => {
    const { body, files = {} } = req;
    logger.info(`Direct Enrollment request received. Body fields: ${Object.keys(body).join(", ")}. Files received: ${Object.keys(files).join(", ")}`);
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // 1. Strict Validation: All Fields Required (Including Files)
        const requiredBodyFields = [
            'lastName', 'firstName', 'middleName', 'grade', 'residentialAddress', 'pincode', 'gender', 'dob', 'pob', 
            'aadhar', 'religion', 'caste', 'subcaste', 'fatherName', 'fatherMobile', 'fatherEmail', 'fatherOccupation', 
            'motherName', 'motherMobile', 'motherOccupation', 'motherTongue', 'taluka', 'district', 'state', 
            'bloodGroup', 'medicalCondition', 'allergies', 'enrollmentDate', 'academicYear',
            'requiresTransport', 'transportRange'
        ];

        for (const field of requiredBodyFields) {
            if (!body[field] || body[field].toString().trim() === '') {
                throw new Error(`${field} is required.`);
            }
        }

        const requiredFiles = ['passportPhoto', 'birthCert', 'leavingCert', 'casteCert', 'aadharCopy'];
        for (const fileKey of requiredFiles) {
            if (!files[fileKey] || !Array.isArray(files[fileKey]) || files[fileKey].length === 0) {
                logger.error(`Validation Failure: ${fileKey} is missing from request.`);
                return res.status(400).json({ error: `${fileKey} document is required.` });
            }
            const fileSize = files[fileKey][0].size;
            if (fileSize < 20 * 1024 || fileSize > 1024 * 1024) { // Relaxed for diagnostics: 20KB to 1MB
                return res.status(400).json({ error: `${fileKey} must be between 20KB and 1MB.` });
            }
        }

        // 2. Data Mapping
        const data = {
            first_name: body.firstName,
            last_name: body.lastName,
            middle_name: body.middleName,
            gender: body.gender,
            grade: body.grade,
            dob: body.dob,
            pob: body.pob,
            aadhar: body.aadhar,
            religion: body.religion,
            caste: body.caste,
            subcaste: body.subcaste,
            address: body.residentialAddress || body.address,
            pincode: body.pincode,
            father_name: body.fatherName,
            father_mobile: body.fatherMobile,
            father_email: body.fatherEmail,
            father_occupation: body.fatherOccupation,
            mother_name: body.motherName,
            mother_mobile: body.motherMobile,
            mother_occupation: body.motherOccupation,
            mother_tongue: body.motherTongue,
            taluka: body.taluka,
            district: body.district,
            state: body.state,
            blood_group: body.bloodGroup,
            medical_condition: body.medicalCondition,
            allergies: body.allergies,
            enrollment_date: body.enrollmentDate,
            
            // Previous Academic History
            prev_school: body.prevSchoolName,
            prev_class: body.prevClass,
            prev_board: body.prevBoard,
            prev_year: body.prevYear,
            prev_percentage: parseFloat(body.prevPercentage) || 0,

            academic_year: body.academicYear,
            requires_transport: body.requiresTransport === 'true' || body.requiresTransport === true,
            transport_range: body.transportRange || 'none'
        };

        // 3. Resolve Academic Year
        const [yearResult] = await connection.query(`SELECT id FROM academic_years WHERE year_name = ?`, [data.academic_year]);
        let academicYearId = yearResult[0]?.id;
        if (!academicYearId) {
            const [activeYear] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
            academicYearId = activeYear[0]?.id;
        }

        // 4. Identity Provisioning (Consolidated into Students/Parents tables)
        const [countRow] = await connection.query(`SELECT COUNT(*) as count FROM students`);
        const nextCount = (countRow[0]?.count || 0) + 1;
        const studentIdNo = body.studentIdNo || `NGA${nextCount.toString().padStart(7, '0')}`;
        const rawPassword = Math.random().toString(36).slice(-8); 
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const appNo = await generateApplicationNo(connection);

        const fullName = `${data.first_name} ${data.middle_name} ${data.last_name}`.replace(/\s+/g, ' ').trim();
        const parentUsername = data.father_mobile || data.mother_mobile;

        // 5. Create Student Master Profile (Including Auth Credentials)
        const [stdRes] = await connection.query(
            `INSERT INTO students (
                student_id_no, application_no, username, password,
                first_name, last_name, middle_name, student_name,
                gender, dob, pob, aadhar_no, religion, caste, subcaste, mother_tongue, 
                residential_address, pincode, taluka, district, state, 
                blood_group, medical_condition, allergies, enrollment_date, admission_date,
                prev_school, prev_class, prev_board, prev_year, prev_percentage,
                doc_passport_photo, doc_birth_cert, doc_leaving_cert, doc_caste_cert, doc_aadhar_copy,
                status, admission_through, gr_no, pen_no, age, current_grade, academic_year_id,
                requires_transport, transport_range
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'Direct Enrollment', ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentIdNo, appNo, studentIdNo, hashedPassword, // Using studentIdNo as username
                data.first_name, data.last_name, data.middle_name, fullName,
                data.gender, data.dob, data.pob, data.aadhar, data.religion, data.caste, data.subcaste, data.mother_tongue,
                data.address, data.pincode, data.taluka, data.district, data.state, 
                data.blood_group, data.medical_condition, data.allergies, data.enrollment_date, body.admissionDate || data.enrollment_date,
                data.prev_school, data.prev_class, data.prev_board, data.prev_year, data.prev_percentage,
                files['passportPhoto'][0].path,
                files['birthCert'][0].path,
                files['leavingCert'][0].path,
                files['casteCert'][0].path,
                files['aadharCopy'][0].path,
                body.grNo || null, body.penNo || null, body.age || null, data.grade, academicYearId,
                data.requires_transport ? 1 : 0, data.transport_range
            ]
        );
        const studentId = stdRes.insertId;
        
        // 5b. Create Parent Profile (Including Auth Credentials)
        const [roleRows] = await connection.query("SELECT id FROM roles WHERE role_name = 'parent' LIMIT 1");
        const parentRoleId = roleRows[0]?.id;

        await connection.query(
            `INSERT INTO parents (
                student_id, username, password, role_id,
                father_name, father_mobile, father_email, father_occupation,
                mother_name, mother_mobile, mother_occupation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId, parentUsername, hashedPassword, parentRoleId,
                data.father_name, data.father_mobile, data.father_email, data.father_occupation,
                data.mother_name, data.mother_mobile, data.mother_occupation
            ]
        );

        // 6. Classroom Provisioning (Resolved by Master Identity)
        const trimmedGrade = data.grade.trim();
        const [classes] = await connection.query(`SELECT id FROM classrooms WHERE TRIM(class_name) = ? LIMIT 1`, [trimmedGrade]);
        let finalClassroomId = classes[0]?.id;
        if (!finalClassroomId) {
            const [newClass] = await connection.query(`INSERT INTO classrooms (class_name, grade_level, capacity, status) VALUES (?, ?, 40, 'active')`, [trimmedGrade, trimmedGrade.match(/\d+/) ? trimmedGrade.match(/\d+/)[0] : 0]);
            finalClassroomId = newClass.insertId;
        }

        // 7. Academic Enrollment
        await connection.query(
            `INSERT INTO student_enrollments (student_id, classroom_id, roll_number, grade, academic_year_id, status, requires_transport, transport_range, pickup_point) 
             VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`, 
            [studentId, finalClassroomId, 1, data.grade, academicYearId, data.requires_transport ? 1 : 0, data.transport_range, body.pickupPoint || body.transportRoute || null]
        );

        // Alphabetical Roll Synchronization Protocol
        await recalculateRollNumbers(connection, finalClassroomId, academicYearId);


        await connection.commit();
        res.status(201).json({ 
            message: "Student Enrolled Successfully", 
            student_id: studentIdNo, 
            application_no: appNo, 
            credentials: { 
                student_login_id: studentIdNo, 
                parent_login_id: parentUsername, 
                temporary_password: rawPassword 
            } 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        logger.error("Direct Enrollment Error:", error);
        res.status(500).json({ error: error.message || "Enrollment failed" });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * ADMIN ROUTE: Fetches all admission records.
 */
export const getAllApplications = async (req, res) => {
    try {
        const { grade, academicYear } = req.query;
        // Institutional Registry: Fetching directly from students and parents tables
        let query = `SELECT s.id, s.application_no, s.first_name, s.last_name, s.middle_name, 
                            p.father_name, s.gender, s.current_grade as grade, s.dob, s.aadhar_no as aadhar, 
                            p.father_mobile, s.status, s.created_at 
                     FROM students s
                     LEFT JOIN parents p ON s.id = p.student_id
                     WHERE s.admission_through = 'Direct Enrollment'`;
        const params = [];

        if (grade) { query += ` AND s.current_grade = ?`; params.push(grade); }
        if (academicYear && academicYear.toString().trim() !== '') {
            if (isNaN(academicYear)) {
                // It's a year name (e.g., '2026-27')
                const [yearRes] = await db.query('SELECT id FROM academic_years WHERE year_name = ?', [academicYear]);
                if (yearRes.length > 0) {
                    query += ` AND s.academic_year_id = ?`;
                    params.push(yearRes[0].id);
                }
            } else {
                // It's an ID
                query += ` AND s.academic_year_id = ?`;
                params.push(academicYear);
            }
        }

        query += ` ORDER BY s.created_at DESC`;
        const [rows] = await db.query(query, params);
        res.status(200).json(rows.map(r => ({
            ...r,
            student_name: `${r.last_name || ''} ${r.first_name || ''} ${r.middle_name || ''}`.trim()
        })));
    } catch (error) {
        logger.error("Error fetching applications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * ADMIN ROUTE: Retrieves a single enrollment record.
 */
export const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT s.*, p.*, ay.year_name as academic_year 
            FROM students s
            LEFT JOIN parents p ON s.id = p.student_id
            LEFT JOIN academic_years ay ON s.academic_year_id = ay.id 
            WHERE s.id = ?
        `, [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Record not found" });
        res.status(200).json(rows[0]);
    } catch (error) {
        logger.error("Error fetching record details:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * ADMIN ROUTE: Updates enrollment details.
 */
export const updateApplicationDetails = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const body = req.body;
        
        // 1. Student Master Update Mapping
        const studentFields = {
            first_name: body.firstName,
            last_name: body.lastName,
            middle_name: body.middleName,
            student_name: `${body.lastName} ${body.firstName} ${body.middleName}`.trim(),
            gender: body.gender,
            dob: body.dob,
            pob: body.pob,
            aadhar_no: body.aadhar,
            religion: body.religion,
            caste: body.caste,
            subcaste: body.subcaste,
            mother_tongue: body.motherTongue,
            residential_address: body.residentialAddress,
            pincode: body.pincode,
            taluka: body.taluka,
            district: body.district,
            state: body.state,
            blood_group: body.bloodGroup,
            medical_condition: body.medicalCondition,
            allergies: body.allergies,
            enrollment_date: body.enrollmentDate,
            admission_date: body.admissionDate || body.enrollmentDate,
            prev_school: body.prevSchoolName,
            prev_class: body.prevClass,
            prev_board: body.prevBoard,
            prev_year: body.prevYear,
            prev_percentage: body.prevPercentage,
            gr_no: body.grNo,
            pen_no: body.penNo,
            age: body.age,
            current_grade: body.grade,
            requires_transport: body.requiresTransport ? 1 : 0,
            transport_range: body.transportRange || 'none'
        };

        const validStudentData = Object.fromEntries(
            Object.entries(studentFields).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(validStudentData).length > 0) {
            const setClause = Object.keys(validStudentData).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(validStudentData), id];
            await connection.query(`UPDATE students SET ${setClause} WHERE id = ?`, values);
        }

        // 2. Parent Profile Update Mapping
        const parentFields = {
            father_name: body.fatherName,
            father_mobile: body.fatherMobile,
            father_email: body.fatherEmail,
            father_occupation: body.fatherOccupation,
            mother_name: body.motherName,
            mother_mobile: body.motherMobile,
            mother_occupation: body.motherOccupation
        };

        const validParentData = Object.fromEntries(
            Object.entries(parentFields).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(validParentData).length > 0) {
            const setClause = Object.keys(validParentData).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(validParentData), id];
            await connection.query(`UPDATE parents SET ${setClause} WHERE student_id = ?`, values);
        }

        await connection.commit();
        res.status(200).json({ message: "Student and Parent records synchronized successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        logger.error("Error updating application details:", error);
        res.status(500).json({ error: "Internal Protocol Error: Failed to synchronize records" });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * ADMIN ROUTE: Deletes an enrollment record.
 */
export const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(`DELETE FROM students WHERE id = ?`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Record not found" });
        res.status(200).json({ message: "Record deleted successfully" });
    } catch (error) {
        logger.error("Error deleting record:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * ADMIN ROUTE: Aggregates stats.
 */
export const getAdmissionStats = async (req, res) => {
    try {
        const { academicYear } = req.query;
        let query = `
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN admission_through = 'Direct Enrollment' THEN 1 ELSE 0 END), 0) as enrolled
            FROM students
            WHERE 1=1
        `;
        const params = [];

        if (academicYear && academicYear.toString().trim() !== '') {
            if (isNaN(academicYear)) {
                const [yearRes] = await db.query('SELECT id FROM academic_years WHERE year_name = ?', [academicYear]);
                if (yearRes.length > 0) {
                    query += ` AND academic_year_id = ?`;
                    params.push(yearRes[0].id);
                }
            } else {
                query += ` AND academic_year_id = ?`;
                params.push(academicYear);
            }
        }

        const [rows] = await db.query(query, params);
        res.status(200).json(rows[0]);
    } catch (error) {
        logger.error("Error fetching admission stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};

