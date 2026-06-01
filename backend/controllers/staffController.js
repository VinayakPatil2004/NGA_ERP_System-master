import db from '../config/db.js';
import bcrypt from 'bcrypt';
import logger from '../utils/logger.js';

// Helper to generate random password (8-20 characters)
const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const length = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Onboard Staff (principal, Teacher, Accountant, HR)
export const onboardStaff = async (req, res) => {
    logger.info("Staff onboarding request received");
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const body = req.body;
        const files = req.files || {};

        // 2. Resolve Role ID and Create User Account
        const [roleRows] = await connection.query("SELECT id FROM roles WHERE role_name = ?", [body.role]);
        const roleId = roleRows[0]?.id;

        if (!roleId) {
            return res.status(400).json({ error: `Role '${body.role}' not found in the system.` });
        }

        // Username as mobile or email (prefer email)
        const username = body.email || body.mobile;

        // Check for existing username
        const [existingUser] = await connection.query("SELECT id FROM staff WHERE username = ?", [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: `A staff member with this ${body.email ? 'email' : 'mobile number'} already exists as a username.` });
        }

        // Resolve Academic Year
        let academicYearId = null;
        if (body.academicYear) {
            const [years] = await connection.query(`SELECT id FROM academic_years WHERE year_name = ?`, [body.academicYear]);
            if (years.length > 0) {
                academicYearId = years[0].id;
            }
        }
        if (!academicYearId) {
            const [activeYear] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
            if (activeYear.length > 0) {
                academicYearId = activeYear[0].id;
            }
        }

        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Generate Employee ID (Next available based on Academic Year or current calendar year)
        let year = new Date().getFullYear();
        if (body.academicYear && body.academicYear.includes('-')) {
            const parsedYear = parseInt(body.academicYear.split('-')[0]);
            if (!isNaN(parsedYear)) {
                year = parsedYear;
            }
        }
        const [maxIdRows] = await connection.query(`SELECT MAX(id) as maxId FROM staff`);
        const nextId = (maxIdRows[0]?.maxId || 0) + 1;
        const employeeId = body.employeeId || `NGA/STF/${year}/${nextId.toString().padStart(4, '0')}`;

        // 3. Create Staff Record (Including Auth Credentials)
        const staffData = {
            username: username || employeeId,
            password: hashedPassword,
            employee_id: employeeId,
            universal_number: body.universalNumber || null,
            full_name: body.fullName,
            staff_type: body.staffType || (body.role.toLowerCase() === 'teacher' ? 'teaching' : 'non-teaching'),
            role_id: roleId,
            designation: body.designation || null,
            department: body.department || null,
            qualification: body.qualification || null,
            specialization: body.specialization || null,
            experience: body.experience || null,
            previous_schools: body.previousSchools || '[]',
            dob: body.dob || null,
            gender: (body.gender || 'male').toLowerCase(),
            mobile: body.mobile || null,
            emergency_contact: body.emergencyContact || null,
            aadhar_no: body.aadharNo || null,
            pan_no: body.panNo || null,
            alternate_mobile: body.alternateMobile || null,
            email: body.email || null,
            address: body.address || null,
            joining_date: body.joiningDate || new Date(),
            employment_type: body.employmentType || 'Full-time',
            salary: isNaN(parseFloat(body.salary)) ? 0 : parseFloat(body.salary),
            bank_name: body.bankName,
            account_no: body.accountNo,
            ifsc_code: body.ifscCode,
            remarks: body.remarks,
            subjects: body.subjects,
            doc_photo: files['photo']?.[0]?.path,
            doc_aadhar: files['aadhar']?.[0]?.path,
            doc_pan: files['pan']?.[0]?.path,
            doc_address_proof: files['addressProof']?.[0]?.path,
            doc_bank_passbook: files['bankPassbook']?.[0]?.path,
            doc_qual_certs: files['qualCerts']?.[0]?.path,
            doc_exp_letter: files['expLetter']?.[0]?.path,
            doc_resume: files['resume']?.[0]?.path,
            doc_driving_license: files['drivingLicense']?.[0]?.path,
            doc_rc_book: files['rcBook']?.[0]?.path,
            doc_insurance: files['insurance']?.[0]?.path,
            doc_fitness_cert: files['fitnessCert']?.[0]?.path,
            doc_medical_cert: files['medicalCert']?.[0]?.path,
            status: body.status || 'active',
            academic_year_id: academicYearId
        };

        const [staffResult] = await connection.query(
            `INSERT INTO staff (
                username, password, employee_id, universal_number, full_name, 
                staff_type, role_id, designation, department, qualification, 
                specialization, experience, previous_schools, dob, gender, 
                mobile, emergency_contact, aadhar_no, pan_no, alternate_mobile, 
                email, address, joining_date, employment_type, salary, 
                bank_name, account_no, ifsc_code, remarks, subjects, 
                doc_photo, doc_aadhar, doc_pan, doc_address_proof, 
                doc_bank_passbook, doc_qual_certs, doc_exp_letter, doc_resume, 
                doc_driving_license, doc_rc_book, doc_insurance, 
                doc_fitness_cert, doc_medical_cert, status, academic_year_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                staffData.username, staffData.password, staffData.employee_id, staffData.universal_number, staffData.full_name,
                staffData.staff_type, staffData.role_id, staffData.designation, staffData.department, staffData.qualification,
                staffData.specialization, staffData.experience, staffData.previous_schools, staffData.dob, staffData.gender,
                staffData.mobile, staffData.emergency_contact, staffData.aadhar_no, staffData.pan_no, staffData.alternate_mobile,
                staffData.email, staffData.address, staffData.joining_date, staffData.employment_type, staffData.salary,
                staffData.bank_name, staffData.account_no, staffData.ifsc_code, staffData.remarks, staffData.subjects,
                staffData.doc_photo, staffData.doc_aadhar, staffData.doc_pan, staffData.doc_address_proof,
                staffData.doc_bank_passbook, staffData.doc_qual_certs, staffData.doc_exp_letter, staffData.doc_resume,
                staffData.doc_driving_license, staffData.doc_rc_book, staffData.doc_insurance,
                staffData.doc_fitness_cert, staffData.doc_medical_cert, staffData.status, staffData.academic_year_id
            ]
        );
        const staffId = staffResult.insertId;

        // 4. Academic Assignment (If Teacher)
        if (body.role.toLowerCase() === 'teacher' && body.grade && body.academicYear) {
            await connection.query(
                `INSERT INTO class_assignments (staff_id, grade, subjects, academic_year) VALUES (?, ?, ?, ?)`,
                [staffId, body.grade, body.subjects, body.academicYear]
            );
        }

        await connection.commit();
        logger.success(`Staff onboarded successfully: ${employeeId}`);
        res.status(201).json({
            message: "Staff onboarded successfully",
            employeeId,
            credentials: { username: username || employeeId, password }
        });

    } catch (error) {
        await connection.rollback();
        logger.error("Error onboarding staff:", error);
        res.status(500).json({
            error: "Failed to onboard staff",
            details: error.message,
            sqlMessage: error.sqlMessage // Include MySQL specific error if available
        });
    } finally {
        connection.release();
    }
};

// Get All Staff
export const getAllStaff = async (req, res) => {
    try {
        const { role, type, status } = req.query;
        let query = `
            SELECT s.*, r.role_name, ay.year_name as academic_year
            FROM staff s 
            LEFT JOIN roles r ON s.role_id = r.id 
            LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
            WHERE 1=1`;
        const params = [];

        if (role && role !== 'all') {
            query += ` AND r.role_name = ?`;
            params.push(role);
        }
        if (type && type !== 'all') {
            query += ` AND staff_type = ?`;
            params.push(type);
        }
        if (status && status !== 'all') {
            query += ` AND status = ?`;
            params.push(status);
        }

        // Always exclude super-admin role from general staff module
        query += ` AND (r.role_name IS NULL OR r.role_name != 'admin')`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch staff" });
    }
};

// Update Staff Status
export const updateStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query(`UPDATE staff SET status = ? WHERE id = ?`, [status, id]);
        res.json({ message: "Status updated" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update status" });
    }
};

// Get Staff Stats
export const getStaffStats = async (req, res) => {
    try {
        // Total personnel (excluding admin)
        const [total] = await db.query(`
            SELECT COUNT(*) as count 
            FROM staff s
            JOIN roles r ON s.role_id = r.id
            WHERE r.role_name != 'admin'
        `);

        const [teaching] = await db.query(`
            SELECT COUNT(*) as count 
            FROM staff s
            JOIN roles r ON s.role_id = r.id
            WHERE r.role_name = 'teacher'
        `);

        const [inactive] = await db.query(`
            SELECT COUNT(*) as count 
            FROM staff s
            JOIN roles r ON s.role_id = r.id
            WHERE s.status = 'inactive' AND r.role_name != 'admin'
        `);

        // Administration Count (Excluding super-admin)
        const [adminCount] = await db.query(`
            SELECT COUNT(*) as count 
            FROM staff s 
            JOIN roles r ON s.role_id = r.id 
            WHERE r.role_name IN ('principal', 'HR', 'accountant', 'librarian', 'Counsellor')
        `);

        // Support Staff Count
        const [supportCount] = await db.query(`
            SELECT COUNT(*) as count 
            FROM staff s 
            JOIN roles r ON s.role_id = r.id 
            WHERE r.role_name IN ('Aunty', 'Canteen', 'Security Gaurd', 'Bus Driver')
        `);

        res.json({
            total: total[0].count,
            teaching: teaching[0].count,
            administration: adminCount[0].count,
            supportStaff: supportCount[0].count,
            inactive: inactive[0].count
        });
    } catch (error) {
        logger.error("Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};

// Get Staff Profile
export const getStaffProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const [staffRows] = await db.query(`
            SELECT s.*, r.role_name, ay.year_name as academic_year
            FROM staff s 
            LEFT JOIN roles r ON s.role_id = r.id 
            LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
            WHERE s.id = ?`, [id]);
        if (staffRows.length === 0) return res.status(404).json({ error: "Staff not found" });

        const [assignments] = await db.query(`SELECT * FROM class_assignments WHERE staff_id = ?`, [id]);
        const [classrooms] = await db.query(`SELECT class_name as grade, 'Class Teacher' as subjects FROM classrooms WHERE class_teacher_id = ?`, [id]);

        res.json({
            ...staffRows[0],
            assignments: [...assignments, ...classrooms]
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
};

// Update Staff Record
export const updateStaff = async (req, res) => {
    logger.info("Staff update request received");
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const body = req.body;
        const files = req.files || {};

        // 1. Resolve Role ID and Update Staff Record
        const [roleRows] = await connection.query("SELECT id FROM roles WHERE role_name = ?", [body.role]);
        const roleId = roleRows[0]?.id;

        // Resolve Academic Year
        let academicYearId = null;
        if (body.academicYear) {
            const [years] = await connection.query(`SELECT id FROM academic_years WHERE year_name = ?`, [body.academicYear]);
            if (years.length > 0) {
                academicYearId = years[0].id;
            }
        }

        const staffData = {
            full_name: body.fullName,
            universal_number: body.universalNumber || null,
            staff_type: body.staffType || 'non-teaching',
            role_id: roleId,
            designation: body.designation || null,
            department: body.department || null,
            qualification: body.qualification || null,
            specialization: body.specialization || null,
            experience: body.experience || null,
            previous_schools: body.previousSchools || '[]',
            dob: body.dob || null,
            gender: (body.gender || 'male').toLowerCase(),
            mobile: body.mobile || null,
            emergency_contact: body.emergencyContact || null,
            aadhar_no: body.aadharNo || null,
            pan_no: body.panNo || null,
            alternate_mobile: body.alternateMobile || null,
            email: body.email || null,
            address: body.address || null,
            joining_date: body.joiningDate || new Date(),
            employment_type: body.employmentType || 'Full-time',
            salary: isNaN(parseFloat(body.salary)) ? 0 : parseFloat(body.salary),
            bank_name: body.bankName,
            account_no: body.accountNo,
            ifsc_code: body.ifscCode,
            remarks: body.remarks,
            subjects: body.subjects,
            status: body.status || 'active',
            ...(academicYearId && { academic_year_id: academicYearId })
        };

        if (files['photo']) staffData.doc_photo = files['photo'][0].path;
        if (files['aadhar']) staffData.doc_aadhar = files['aadhar'][0].path;
        if (files['pan']) staffData.doc_pan = files['pan'][0].path;
        if (files['addressProof']) staffData.doc_address_proof = files['addressProof'][0].path;
        if (files['bankPassbook']) staffData.doc_bank_passbook = files['bankPassbook'][0].path;
        if (files['qualCerts']) staffData.doc_qual_certs = files['qualCerts'][0].path;
        if (files['expLetter']) staffData.doc_exp_letter = files['expLetter'][0].path;
        if (files['resume']) staffData.doc_resume = files['resume'][0].path;
        if (files['drivingLicense']) staffData.doc_driving_license = files['drivingLicense'][0].path;
        if (files['rcBook']) staffData.doc_rc_book = files['rcBook'][0].path;
        if (files['insurance']) staffData.doc_insurance = files['insurance'][0].path;
        if (files['fitnessCert']) staffData.doc_fitness_cert = files['fitnessCert'][0].path;
        if (files['medicalCert']) staffData.doc_medical_cert = files['medicalCert'][0].path;

        await connection.query(`UPDATE staff SET ? WHERE id = ?`, [staffData, id]);

        // 2. Update Authentication Credentials (within the same table)
        const authData = {
            username: body.email || body.mobile,
            email: body.email,
            role_id: roleId
        };
        await connection.query(`UPDATE staff SET ? WHERE id = ?`, [authData, id]);

        // 3. Update Academic Assignment
        if (body.grade && body.academicYear) {
            const [existing] = await connection.query(
                `SELECT id FROM class_assignments WHERE staff_id = ? AND academic_year = ?`,
                [id, body.academicYear]
            );
            if (existing.length > 0) {
                await connection.query(
                    `UPDATE class_assignments SET grade = ?, subjects = ? WHERE id = ?`,
                    [body.grade, body.subjects, existing[0].id]
                );
            } else {
                await connection.query(
                    `INSERT INTO class_assignments (staff_id, grade, subjects, academic_year) VALUES (?, ?, ?, ?)`,
                    [id, body.grade, body.subjects, body.academicYear]
                );
            }
        }

        await connection.commit();
        logger.success(`Staff updated successfully ID: ${id}`);
        res.json({ message: "Staff updated successfully" });

    } catch (error) {
        await connection.rollback();
        logger.error("Error updating staff:", error);
        res.status(500).json({ error: error.message || "Failed to update staff" });
    } finally {
        connection.release();
    }
};

// Delete Staff (Full lifecycle)
export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM class_assignments WHERE staff_id = ?`, [id]);
        const [result] = await db.query(`DELETE FROM staff WHERE id = ?`, [id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "Record not found" });
        res.json({ message: "Staff record and credentials Deleted successfully" });
    } catch (error) {
        logger.error("Error deleting staff:", error);
        res.status(500).json({ error: "Failed to delete staff record" });
    }
};
