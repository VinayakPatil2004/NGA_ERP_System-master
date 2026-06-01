import db from '../config/db.js';
import xlsx from 'xlsx';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { reorderRollNumbers } from './classroomController.js';

// 1. Bulk Import Library Books
export const importLibraryBooks = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                const { 
                    title, author, isbn, genre, publisher, 
                    year, copies, available, shelf, rack_number, status, 
                    academic_year 
                } = row;

                if (!title || !author) throw new Error("Title and Author are required");

                // Resolve Academic Year
                let academicYearId = null;
                if (academic_year) {
                    const [years] = await connection.query(`SELECT id FROM academic_years WHERE year_name = ?`, [academic_year]);
                    if (years.length > 0) academicYearId = years[0].id;
                }

                if (!academicYearId) {
                    const [activeYear] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
                    academicYearId = activeYear[0]?.id;
                }

                await connection.query(`
                    INSERT INTO library_books (
                        title, author, isbn, genre, publisher,
                        year, copies, available, shelf, rack_number, status, academic_year_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    title, 
                    author, 
                    isbn || null, 
                    genre || 'General', 
                    publisher || null, 
                    year || new Date().getFullYear(), 
                    copies || 1, 
                    available || copies || 1, 
                    shelf || null,
                    rack_number || null,
                    status || 'Available', 
                    academicYearId
                ]);

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ 
            message: "Library books import completed", 
            totalRows: data.length, 
            inserted, 
            failed: errors.length, 
            errors 
        });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 1b. Bulk Import Library Transactions (Issue/Return)
export const importLibraryTransactions = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue;

            try {
                // Fields: book_title/isbn, member_id (gr_no), issue_date, due_date, return_date
                // Expanded matching for simplified normalized keys
                const bookKey = row.booktitle || row.title || row.isbn || row.booktitleisbn;
                const memberId = row.memberid || row.grno || row.studentno || row.memberidgrno;
                const { issuedate, duedate, returndate, status } = row;

                if (!bookKey || !memberId) {
                    console.log("Missing fields in row:", row);
                    throw new Error("Book Title/ISBN and Member ID are required");
                }

                console.log(`Processing row: Book=${bookKey}, Member=${memberId}`);

                // 1. Resolve Book
                let bookId;
                const [books] = await connection.query(
                    `SELECT id FROM library_books WHERE isbn = ? OR title = ? LIMIT 1`,
                    [String(bookKey), String(bookKey)]
                );
                if (books.length > 0) {
                    bookId = books[0].id;
                    console.log(`Resolved Book: ID=${bookId}`);
                } else {
                    console.log(`Failed to resolve Book: ${bookKey}`);
                    throw new Error(`Book '${bookKey}' not found in catalog`);
                }

                // 2. Resolve Student
                let studentId;
                const [students] = await connection.query(
                    `SELECT id, student_name FROM students WHERE gr_no = ? OR student_id_no = ? LIMIT 1`,
                    [String(memberId), String(memberId)]
                );
                if (students.length > 0) {
                    studentId = students[0].id;
                    console.log(`Resolved Student: ID=${studentId}, Name=${students[0].student_name}`);
                } else {
                    console.log(`Failed to resolve Student: ${memberId}`);
                    throw new Error(`Student with ID '${memberId}' not found`);
                }

                // 3. Resolve Academic Year
                let ayId = null;
                if (row.academicyear) {
                    const [years] = await connection.query(`SELECT id FROM academic_years WHERE year_name = ?`, [row.academicyear]);
                    ayId = years[0]?.id;
                    console.log(`Resolved AY from file: ${row.academicyear} -> ID=${ayId}`);
                }
                if (!ayId) {
                    const [active] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
                    ayId = active[0]?.id;
                    console.log(`Resolved Active AY: ID=${ayId}`);
                }

                // 4. Calculate Status
                let finalStatus = status || 'Active';
                const today = new Date();
                const due = duedate ? new Date(duedate) : new Date(today.getTime() + 14 * 86400000);
                
                if (returndate) {
                    const ret = new Date(returndate);
                    finalStatus = ret > due ? 'Returned Late' : 'Returned';
                } else if (new Date() > due) {
                    finalStatus = 'Overdue';
                }

                // 5. Insert Transaction
                await connection.query(`
                    INSERT INTO library_issues (
                        book_id, member_id, member_name, member_class, 
                        issue_date, due_date, return_date, status, academic_year_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    bookId, 
                    memberId, 
                    students[0].student_name,
                    row.memberclass || row.class || 'N/A',
                    issuedate || today.toISOString().split('T')[0],
                    due.toISOString().split('T')[0],
                    returndate || null,
                    finalStatus,
                    ayId
                ]);

                // 6. Update Book Availability if Active
                if (finalStatus === 'Active' || finalStatus === 'Overdue') {
                    await connection.query(`UPDATE library_books SET available = available - 1 WHERE id = ?`, [bookId]);
                }

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Library transactions import completed", inserted, failed: errors.length, errors });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 2. Bulk Import Staff
export const importStaff = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue;

            try {
                // Support both snake_case and normalized keys
                const full_name = row.fullname || row.name || row.staffname || row.full_name;
                const universal_number = row.universalnumber || row.universalno || row.uid || row.universal_number;
                const staff_type = row.stafftype || row.type || row.staff_type;
                const role_name = row.rolename || row.role || row.role_name;
                const designation = row.designation || row.post || row.designation;
                const qualification = row.qualification || row.edu || row.qualification;
                const specialization = row.specialization || row.subject || row.specialization;
                const experience = row.experience || row.exp || row.experience;
                const previous_schools = row.previousschools || row.prevschools || row.previous_schools;
                const mobile = row.mobile || row.phone || row.contact || row.mobile;
                const emergency_contact = row.emergencycontact || row.emergency || row.emergency_contact;
                const email = row.email;
                const gender = row.gender || row.sex || row.gender;
                const dob = row.dob || row.birthdate || row.dob;
                const aadhar_no = row.aadharno || row.aadhar || row.aadhar_no;
                const pan_no = row.panno || row.pan || row.pan_no;
                const joining_date = row.joiningdate || row.join || row.joining_date;
                const address = row.address;
                const bank_name = row.bankname || row.bank || row.bank_name;
                const account_no = row.accountno || row.accno || row.account_no;
                const ifsc_code = row.ifsccode || row.ifsc || row.ifsc_code;
                const status = row.status || 'active';
                const academic_year = row.academicyear || row.year || row.academic_year;

                // Validation as per StafOnboardingForm
                if (!full_name) throw new Error("Full Name is missing");
                if (!mobile) throw new Error("Mobile Number is missing");
                if (!gender) throw new Error("Gender is missing");
                if (!dob) throw new Error("Date of Birth is missing");
                if (!role_name) throw new Error("Role is missing");

                // Resolve Academic Year
                let academicYearId = null;
                let currentYearName = academic_year || '2026-27';
                
                const [years] = await connection.query(`SELECT id FROM academic_years WHERE year_name = ?`, [currentYearName]);
                if (years.length > 0) academicYearId = years[0].id;

                if (!academicYearId) {
                    const [activeYear] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
                    academicYearId = activeYear[0]?.id;
                    currentYearName = activeYear[0]?.year_name || '2026-27';
                }

                // Resolve Role ID
                let roleId = null;
                const [roleRows] = await connection.query(`SELECT id FROM roles WHERE role_name = ?`, [role_name]);
                if (roleRows.length > 0) roleId = roleRows[0].id;
                
                if (!roleId) {
                    throw new Error(`Role '${role_name}' not found in system`);
                }

                // Staff ID format: NGA/STF/2026/0025
                const yearPrefix = currentYearName.split('-')[0];
                const [countRes] = await connection.query(`SELECT COUNT(*) as count FROM staff`);
                const finalEmployeeId = `NGA/STF/${yearPrefix}/${String(countRes[0].count + 1 + i).padStart(4, '0')}`;

                // Password Hash
                const password = await bcrypt.hash("123456", 10);
                const username = email || mobile || finalEmployeeId;

                await connection.query(`
                    INSERT INTO staff (
                        username, password, full_name, employee_id, universal_number,
                        staff_type, role_id, designation, qualification, specialization,
                        experience, previous_schools, mobile, emergency_contact, email,
                        gender, dob, aadhar_no, pan_no, joining_date, address,
                        bank_name, account_no, ifsc_code, status, academic_year_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    username, password, full_name, finalEmployeeId, universal_number || null,
                    (staff_type || 'teaching').toLowerCase(), roleId, designation || role_name || 'Staff',
                    qualification || null, specialization || null, experience || 0,
                    previous_schools || null, mobile || null, emergency_contact || null,
                    email || null, (gender || 'male').toLowerCase(), dob || null,
                    aadhar_no || null, pan_no || null, 
                    joining_date || new Date().toISOString().split('T')[0],
                    address || null, bank_name || null, account_no || null, ifsc_code || null,
                    status || 'active', academicYearId
                ]);

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ 
            message: "Staff import completed", 
            totalRows: data.length, 
            inserted, 
            failed: errors.length, 
            errors 
        });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// Helper: Generates a unique institutional application number.
const generateApplicationNo = async (connection) => {
    const year = new Date().getFullYear();
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

// 3. Bulk Import Students
export const importStudents = async (req, res) => {
    const connection = await db.getConnection();
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        let inserted = 0;
        let errors = [];

        await connection.beginTransaction();

        const affectedClassrooms = new Set();

        // Get Parent Role ID
        const [roleRows] = await connection.query("SELECT id FROM roles WHERE role_name = 'parent' LIMIT 1");
        const parentRoleId = roleRows[0]?.id;

        // Get Current Student Count for ID Generation
        const [countRow] = await connection.query(`SELECT COUNT(*) as count FROM students`);
        let currentCount = countRow[0]?.count || 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                // 1. Resolve Required Fields
                const {
                    first_name, last_name, middle_name, dob, gender,
                    residential_address, taluka, district, state, pincode,
                    aadhar_no, mother_tongue, gr_no, pen_no,
                    father_name, father_mobile, father_email, father_occupation,
                    mother_name, mother_mobile, mother_occupation,
                    grade, academic_year, roll_number,
                    // Additional Fields from Admission Form
                    pob, religion, caste, subcaste, blood_group, medical_condition, allergies,
                    prev_school, prev_class, prev_board, prev_year, prev_percentage,
                    requires_transport, transport_range,
                    admission_date
                } = row;

                if (!first_name || !last_name || !grade || !academic_year) {
                    throw new Error("Missing required fields (Name, Grade, Academic Year)");
                }

                // Duplicate GR Number check
                if (gr_no) {
                    const [dupGr] = await connection.query(`SELECT id, student_name FROM students WHERE gr_no = ? LIMIT 1`, [String(gr_no).trim()]);
                    if (dupGr.length > 0) {
                        throw new Error(`Duplicate Entry: GR No '${gr_no}' already registered to student '${dupGr[0].student_name}'`);
                    }
                }

                // Duplicate Aadhar Number check
                if (aadhar_no) {
                    const [dupAadhar] = await connection.query(`SELECT id, student_name FROM students WHERE aadhar_no = ? LIMIT 1`, [String(aadhar_no).trim()]);
                    if (dupAadhar.length > 0) {
                        throw new Error(`Duplicate Entry: Aadhar No '${aadhar_no}' already registered to student '${dupAadhar[0].student_name}'`);
                    }
                }

                // 2. Resolve IDs (Academic Year, Classroom)
                const [years] = await connection.query(`SELECT id FROM academic_years WHERE year_name = ?`, [academic_year]);
                if (years.length === 0) throw new Error(`Academic year '${academic_year}' not found`);
                const academicYearId = years[0].id;

                const [classes] = await connection.query(`SELECT id FROM classrooms WHERE TRIM(class_name) = ? LIMIT 1`, [grade]);
                let classroomId = classes[0]?.id;
                if (!classroomId) {
                    const [newClass] = await connection.query(`INSERT INTO classrooms (class_name, grade_level, status) VALUES (?, ?, 'active')`, [grade, grade.match(/\d+/) ? grade.match(/\d+/)[0] : 0]);
                    classroomId = newClass.insertId;
                }

                // 3. Generate Identity
                currentCount++;
                const studentIdNo = `NGA${currentCount.toString().padStart(7, '0')}`;
                const appNo = await generateApplicationNo(connection);
                const fullName = `${last_name} ${first_name} ${middle_name || ''}`.trim();
                const parentUsername = father_mobile || mother_mobile || studentIdNo;
                const defaultPassword = await bcrypt.hash("123456", 10);

                // 4. Insert Student
                const [studentResult] = await connection.query(`
                    INSERT INTO students (
                        student_id_no, application_no, username, password,
                        first_name, last_name, middle_name, student_name,
                        dob, gender, pob, aadhar_no, religion, caste, subcaste, mother_tongue,
                        residential_address, pincode, taluka, district, state,
                        blood_group, medical_condition, allergies, enrollment_date, admission_date,
                        prev_school, prev_class, prev_board, prev_year, prev_percentage,
                        status, admission_through, gr_no, pen_no, current_grade, academic_year_id,
                        requires_transport, transport_range
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'Bulk Import', ?, ?, ?, ?, ?, ?)
                `, [
                    studentIdNo, appNo, studentIdNo, defaultPassword,
                    first_name, last_name, middle_name || null, fullName,
                    dob || null, gender || 'Male', pob || null, aadhar_no || null, religion || null, caste || null, subcaste || null, mother_tongue || null,
                    residential_address || null, pincode || null, taluka || null, district || null, state || null,
                    blood_group || null, medical_condition || null, allergies || null, 
                    admission_date || new Date().toISOString().split('T')[0],
                    admission_date || new Date().toISOString().split('T')[0],
                    prev_school || null, prev_class || null, prev_board || null, prev_year || null, prev_percentage || 0,
                    gr_no || null, pen_no || null, grade, academicYearId,
                    requires_transport === 'true' || requires_transport === true ? 1 : 0, transport_range || 'none'
                ]);

                const studentId = studentResult.insertId;

                // 5. Insert Parent
                await connection.query(`
                    INSERT INTO parents (
                        student_id, username, password, role_id,
                        father_name, father_mobile, father_email, father_occupation,
                        mother_name, mother_mobile, mother_occupation
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    studentId, parentUsername, defaultPassword, parentRoleId,
                    father_name || null, father_mobile || null, father_email || null, father_occupation || null,
                    mother_name || null, mother_mobile || null, mother_occupation || null
                ]);

                // 6. Insert Enrollment
                await connection.query(`
                    INSERT INTO student_enrollments (
                        student_id, classroom_id, grade, academic_year_id, roll_number, status
                    ) VALUES (?, ?, ?, ?, ?, 'active')
                `, [studentId, classroomId, grade, academicYearId, roll_number || null]);

                affectedClassrooms.add(`${classroomId}-${academicYearId}`);

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        // 7. Reorder Roll Numbers for all affected classrooms
        for (const composite of affectedClassrooms) {
            const [cId, aId] = composite.split('-');
            try {
                await reorderRollNumbers(connection, parseInt(cId), parseInt(aId));
            } catch (syncErr) {
                console.error(`Roll reorder failed for class ${cId}:`, syncErr);
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);

        res.json({
            message: "Student bulk synchronization completed",
            totalRows: data.length,
            inserted,
            failed: errors.length,
            errors
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("IMPORT ERROR:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// 4. Bulk Upload Student Documents
export const bulkUploadStudentDocuments = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const results = {
            success: [],
            failed: []
        };

        const typeMap = {
            'PHOTO': 'doc_passport_photo',
            'BIRTH': 'doc_birth_cert',
            'LEAVING': 'doc_leaving_cert',
            'CASTE': 'doc_caste_cert',
            'AADHAR': 'doc_aadhar_copy'
        };

        for (const file of req.files) {
            const originalName = file.originalname.toUpperCase();
            // Expected format: GR2001_PHOTO.JPG or GR-2001_AADHAR.PDF
            const match = originalName.match(/(GR[-_]?\d+)_(\w+)\./);

            if (!match) {
                results.failed.push({ file: file.originalname, reason: "Invalid filename format. Use GRNO_TYPE.ext (e.g. GR2001_PHOTO.jpg)" });
                continue;
            }

            const grNo = match[1];
            const typeKey = match[2];
            const dbColumn = typeMap[typeKey];

            if (!dbColumn) {
                results.failed.push({ file: file.originalname, reason: `Unknown document type '${typeKey}'. Use PHOTO, BIRTH, LEAVING, CASTE, or AADHAR` });
                continue;
            }

            // Find student by GR No
            const [students] = await db.query(`SELECT id FROM students WHERE gr_no = ?`, [grNo]);

            if (students.length === 0) {
                results.failed.push({ file: file.originalname, reason: `Student with GR No ${grNo} not found` });
                continue;
            }

            const studentId = students[0].id;
            const filePath = file.path.replace(/\\/g, '/');

            // Update database
            await db.query(`UPDATE students SET ${dbColumn} = ? WHERE id = ?`, [filePath, studentId]);
            results.success.push({ file: file.originalname, studentId, grNo, type: typeKey });
        }

        res.json({
            message: "Bulk upload processed",
            summary: {
                total: req.files.length,
                successCount: results.success.length,
                failedCount: results.failed.length
            },
            results
        });
    } catch (error) {
        console.error("Bulk Doc Upload Error:", error);
        res.status(500).json({ error: "Failed to process bulk upload" });
    }
};

// 5. Bulk Upload Staff Documents
export const bulkUploadStaffDocuments = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const results = {
            success: [],
            failed: []
        };

        const typeMap = {
            'PHOTO': 'doc_photo',
            'AADHAR': 'doc_aadhar',
            'PAN': 'doc_pan',
            'ADDRESS': 'doc_address_proof',
            'BANK': 'doc_bank_passbook',
            'LICENSE': 'doc_driving_license',
            'RC': 'doc_rc_book',
            'INSURANCE': 'doc_insurance',
            'QUAL': 'doc_qual_certs',
            'EXP': 'doc_exp_letter',
            'RESUME': 'doc_resume'
        };

        for (const file of req.files) {
            const originalName = file.originalname.toUpperCase();
            // Expected format: EMP101_PHOTO.JPG or STF-2026-0001_AADHAR.PDF
            // Handles common delimiters like /, -, _ (slashes converted to underscores in filenames usually)
            const match = originalName.match(/([A-Z0-9\-_/]+)_(\w+)\./);

            if (!match) {
                results.failed.push({ file: file.originalname, reason: "Invalid format. Use EMPID_TYPE.ext (e.g. STF101_PHOTO.jpg)" });
                continue;
            }

            const empId = match[1];
            const typeKey = match[2];
            const dbColumn = typeMap[typeKey];

            if (!dbColumn) {
                results.failed.push({ file: file.originalname, reason: `Unknown type '${typeKey}'. Use PHOTO, AADHAR, PAN, ADDRESS, BANK, LICENSE, RC, INSURANCE, QUAL, EXP, or RESUME` });
                continue;
            }

            // Find staff by Employee ID (trying exact match first, then with underscores replaced by slashes if needed)
            let [staff] = await db.query(`SELECT id FROM staff WHERE employee_id = ?`, [empId]);
            
            if (staff.length === 0) {
                // Try replacing underscores with slashes (common for NGA/STF/...)
                const normalizedEmpId = empId.replace(/_/g, '/');
                [staff] = await db.query(`SELECT id FROM staff WHERE employee_id = ?`, [normalizedEmpId]);
            }

            if (staff.length === 0) {
                results.failed.push({ file: file.originalname, reason: `Staff with ID ${empId} not found` });
                continue;
            }

            const staffId = staff[0].id;
            const ext = originalName.split('.').pop().toLowerCase();
            const newFileName = `${file.filename}.${ext}`;
            const newPath = `${file.destination}/${newFileName}`;
            
            // Rename the file to include the extension
            fs.renameSync(file.path, newPath);

            const filePath = newPath.replace(/\\/g, '/');

            // Update database
            await db.query(`UPDATE staff SET ${dbColumn} = ? WHERE id = ?`, [filePath, staffId]);
            results.success.push({ file: file.originalname, staffId, empId, type: typeKey });
        }

        res.json({
            message: "Staff bulk upload processed",
            summary: {
                total: req.files.length,
                successCount: results.success.length,
                failedCount: results.failed.length
            },
            results
        });
    } catch (error) {
        console.error("Staff Bulk Doc Error:", error);
        res.status(500).json({ error: "Failed to process bulk upload" });
    }
};


// Helper to normalize keys (lowercase, remove spaces/underscores)
const normalizeRow = (row) => {
    if (!row || Object.keys(row).length === 0) return null;
    const normalized = {};
    let hasData = false;
    for (const key in row) {
        if (row[key] === undefined || row[key] === null || row[key] === '') continue;
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        normalized[normalizedKey] = row[key];
        hasData = true;
    }
    return hasData ? normalized : null;
};

// 5. Bulk Import Exam Marks
export const importExamMarks = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue; // Skip empty rows
            try {
                const { 
                    grno, examname, subject, 
                    unitwritten, classtest, project, oral, notebook, termwritten,
                    maxmarks, academicyear 
                } = row;

                if (!grno || !examname || !subject) throw new Error("GR No, Exam Name, and Subject are required");
                
                // Map back to original logical names for processing
                const dataToProcess = {
                    gr_no: grno,
                    exam_name: examname,
                    subject: subject,
                    unit_written: unitwritten,
                    class_test: classtest,
                    project: project,
                    oral: oral,
                    notebook: notebook,
                    term_written: termwritten,
                    max_marks: maxmarks,
                    academic_year: academicyear
                };

                // Resolve Student
                const [students] = await connection.query(`SELECT id FROM students WHERE gr_no = ?`, [dataToProcess.gr_no]);
                if (students.length === 0) throw new Error(`Student with GR No ${dataToProcess.gr_no} not found`);
                const studentId = students[0].id;

                // Resolve Exam
                const [exams] = await connection.query(`SELECT id FROM exams WHERE exam_name = ?`, [dataToProcess.exam_name]);
                if (exams.length === 0) throw new Error(`Exam '${dataToProcess.exam_name}' not found`);
                const examId = exams[0].id;

                // Resolve Academic Year
                let ayId = null;
                if (dataToProcess.academic_year) {
                    const [years] = await connection.query(`SELECT id FROM academic_years WHERE year_name = ?`, [dataToProcess.academic_year]);
                    ayId = years[0]?.id;
                }
                if (!ayId) {
                    const [active] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
                    ayId = active[0]?.id;
                }

                // Calculations
                const obtained = (parseFloat(dataToProcess.unit_written) || 0) + (parseFloat(dataToProcess.class_test) || 0) + (parseFloat(dataToProcess.project) || 0) + 
                                 (parseFloat(dataToProcess.oral) || 0) + (parseFloat(dataToProcess.notebook) || 0) + (parseFloat(dataToProcess.term_written) || 0);
                const max = parseFloat(dataToProcess.max_marks) || 100;
                const percentage = (obtained / max) * 100;
                
                // Simple Grade Logic
                let grade = 'F';
                if (percentage >= 90) grade = 'A+';
                else if (percentage >= 80) grade = 'A';
                else if (percentage >= 70) grade = 'B+';
                else if (percentage >= 60) grade = 'B';
                else if (percentage >= 50) grade = 'C';
                else if (percentage >= 35) grade = 'D';

                await connection.query(`
                    INSERT INTO exam_marks (
                        exam_id, student_id, subject_name, academic_year_id,
                        unit_written, class_test, project, oral, notebook, term_written,
                        total_obtained, total_max, percentage, grade, is_draft
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                    ON DUPLICATE KEY UPDATE 
                        unit_written=VALUES(unit_written), class_test=VALUES(class_test), 
                        project=VALUES(project), oral=VALUES(oral), notebook=VALUES(notebook), 
                        term_written=VALUES(term_written), total_obtained=VALUES(total_obtained),
                        percentage=VALUES(percentage), grade=VALUES(grade)
                `, [
                    examId, studentId, dataToProcess.subject, ayId,
                    dataToProcess.unit_written || 0, dataToProcess.class_test || 0, dataToProcess.project || 0, dataToProcess.oral || 0, dataToProcess.notebook || 0, dataToProcess.term_written || 0,
                    obtained, max, percentage, grade
                ]);

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Exam marks import completed", inserted, failed: errors.length, errors });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 6. Bulk Import Inventory Items
export const importInventory = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();
        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue; // Skip empty rows
            try {
                // Handle variants: 'itemname' or 'name'
                const name = row.name || row.itemname;
                const category = row.category || row.categoryname;
                const room_number = row.roomnumber || row.roomno || row.room;
                const { unit, location, openingstock, minimumstock } = row;
                
                if (!name || !category) throw new Error("Item Name and Category are required");

                await connection.query(`
                    INSERT INTO inventory_items (name, category, unit, location, room_number, opening_stock, minimum_stock, current_stock, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
                `, [name, category, unit || 'pcs', location || 'Main Store', room_number || null, openingstock || 0, minimumstock || 0, openingstock || 0]);
                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }
        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Inventory import completed", inserted, failed: errors.length, errors });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 7. Bulk Import Transport Details (Vehicles & Assignments)
export const importTransport = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();
        let vehiclesSynced = 0;
        let assignmentsSynced = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue; // Skip empty rows
            try {
                const { 
                    vehicleno, drivername, driverphone, routename, capacity,
                    grno, pickuppoint
                } = row;

                if (!vehicleno) throw new Error("Vehicle Number is required");

                // 1. Sync Vehicle
                const [vRows] = await connection.query(`SELECT id FROM transport_vehicles WHERE vehicle_number = ?`, [vehicleno]);
                let vehicleId;
                if (vRows.length === 0) {
                    const [vRes] = await connection.query(`
                        INSERT INTO transport_vehicles (vehicle_number, driver_name, driver_phone, route_name, capacity, status)
                        VALUES (?, ?, ?, ?, ?, 'active')
                    `, [vehicleno, drivername || 'TBA', driverphone || null, routename || 'TBA', capacity || 40]);
                    vehicleId = vRes.insertId;
                    vehiclesSynced++;
                } else {
                    vehicleId = vRows[0].id;
                    await connection.query(`
                        UPDATE transport_vehicles SET driver_name=?, driver_phone=?, route_name=?, capacity=? WHERE id=?
                    `, [drivername || 'TBA', driverphone || null, routename || 'TBA', capacity || 40, vehicleId]);
                }

                // 2. Sync Assignment (if GR No provided)
                if (grno) {
                    const [sRows] = await connection.query(`SELECT id FROM students WHERE gr_no = ?`, [grno]);
                    if (sRows.length > 0) {
                        const studentId = sRows[0].id;
                        await connection.query(`
                            INSERT INTO transport_assignments (vehicle_id, student_id, pickup_point, status)
                            VALUES (?, ?, ?, 'active')
                            ON DUPLICATE KEY UPDATE vehicle_id=VALUES(vehicle_id), pickup_point=VALUES(pickup_point)
                        `, [vehicleId, studentId, pickuppoint || 'Main Stop']);
                        
                        // Update student's transport flag
                        await connection.query(`UPDATE students SET requires_transport = 1 WHERE id = ?`, [studentId]);
                        assignmentsSynced++;
                    }
                }
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }
        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ 
            message: "Transport import completed", 
            vehiclesSynced, 
            assignmentsSynced, 
            failed: errors.length, 
            errors 
        });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 8. Bulk Import Inventory Suppliers
export const importSuppliers = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();
        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue;

            try {
                const { name, contactperson, phone, email, address } = row;
                if (!name) throw new Error("Supplier Name is required");

                await connection.query(`
                    INSERT INTO inventory_suppliers (name, contact_person, phone, email, address)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        contact_person=VALUES(contact_person), phone=VALUES(phone), 
                        email=VALUES(email), address=VALUES(address)
                `, [name, contactperson || null, phone || null, email || null, address || null]);
                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }
        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Suppliers import completed", inserted, failed: errors.length, errors });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 9. Bulk Import Student Fees & Assignments
export const importFees = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue;

            try {
                // Support columns: gr number, name, mobile number, class, fee, discount, transport, total, paid, balance, payment type, transaction id, check details, payment date
                const grNo = String(row.grnumber || row.grno || '').trim();
                const studentName = String(row.name || row.studentname || '').trim();
                const mobileNo = String(row.mobilenumber || row.mobile || '').trim();
                
                const annualFeeVal = Number(row.fee || row.annualfee || 0);
                const discountVal = Number(row.discount || 0);
                const transportVal = Number(row.transport || 0);
                const paidVal = Number(row.paidamount || row.paid || 0);
                const method = String(row.paymenttype || row.paymentmethod || 'cash').toLowerCase();
                const payDate = row.paymentdate || new Date().toISOString().split('T')[0];
                const txnId = row.transactionid || null;
                const chqNo = row.checkdetails || row.chequeno || null;
                const remark = row.remarks || row.remark || 'Bulk Imported Fee Assignment';

                if (!grNo || !studentName || !mobileNo) {
                    throw new Error("GR Number, Name, and Mobile Number are required for strict validation");
                }

                // 1. Resolve Student with strict matching
                const [students] = await connection.query(`
                    SELECT s.id, s.student_name, s.gr_no, s.academic_year_id, p.father_mobile, p.mother_mobile 
                    FROM students s 
                    LEFT JOIN parents p ON s.id = p.student_id 
                    WHERE s.gr_no = ?
                `, [grNo]);

                if (students.length === 0) {
                    throw new Error(`Student not found with GR Number '${grNo}'`);
                }

                const dbStudent = students[0];
                const dbName = String(dbStudent.student_name).trim().toLowerCase();
                const excelName = studentName.toLowerCase();
                
                // Flexible name check (allows slight mismatches but enforces core name match)
                if (dbName !== excelName && !dbName.includes(excelName) && !excelName.includes(dbName)) {
                    throw new Error(`Name mismatch for ${grNo}. DB: ${dbStudent.student_name}, Excel: ${studentName}`);
                }

                const dbMobile = String(dbStudent.father_mobile || dbStudent.mother_mobile || '').trim();
                if (dbMobile !== mobileNo) {
                    throw new Error(`Mobile mismatch for ${grNo}. DB: ${dbMobile}, Excel: ${mobileNo}`);
                }

                let studentId = dbStudent.id;
                let studentNameActual = dbStudent.student_name;
                let activeYearId;
                let gradeActual;
                let studentTypeActual;

                // 2. Resolve Active Year and Grade from student_enrollments
                // Get globally active year first
                const [activeYears] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
                const globalYearId = activeYears.length > 0 ? activeYears[0].id : null;

                let enrollQuery = `SELECT grade, academic_year_id FROM student_enrollments WHERE student_id = ?`;
                let enrollParams = [studentId];
                if (globalYearId) {
                    enrollQuery += ` AND academic_year_id = ?`;
                    enrollParams.push(globalYearId);
                } else {
                    enrollQuery += ` AND status = 'active'`;
                }
                enrollQuery += ` LIMIT 1`;

                let [enrollments] = await connection.query(enrollQuery, enrollParams);
                
                // Fallback to latest enrollment if none found for the target year
                if (enrollments.length === 0) {
                    [enrollments] = await connection.query(`SELECT grade, academic_year_id FROM student_enrollments WHERE student_id = ? ORDER BY academic_year_id DESC LIMIT 1`, [studentId]);
                }

                if (enrollments.length === 0) {
                    throw new Error(`No active enrollment found for student '${studentNameActual}'`);
                }

                gradeActual = enrollments[0].grade;
                activeYearId = enrollments[0].academic_year_id;
                studentTypeActual = (students[0].academic_year_id === activeYearId) ? 'new' : 'old';

                // 3. Resolve base annual fee if not specified in excel
                let finalAnnual = annualFeeVal;
                if (!finalAnnual || finalAnnual === 0) {
                    const [structures] = await connection.query(
                        `SELECT (admission_fee + tuition_fee + term_fee + computer_fee + other_fee) as annual FROM fee_structure WHERE academic_year_id = ? AND grade = ? AND student_type = ? LIMIT 1`,
                        [activeYearId, gradeActual, studentTypeActual]
                    );
                    if (structures.length > 0) {
                        finalAnnual = Number(structures[0].annual) || 0;
                    } else {
                        finalAnnual = 0;
                    }
                }

                const finalTotalPayable = Math.max(0, finalAnnual - discountVal) + transportVal;
                const finalBalance = finalTotalPayable - paidVal;
                const receiptNo = `NGA/FEE/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;

                // Duplicate Payment Checking
                if (paidVal > 0) {
                    if (txnId || chqNo) {
                        const [duplicate] = await connection.query(`
                            SELECT id FROM payments 
                            WHERE (transaction_id = ? AND transaction_id IS NOT NULL) 
                               OR (cheque_no = ? AND cheque_no IS NOT NULL)
                            LIMIT 1
                        `, [txnId, chqNo]);

                        if (duplicate.length > 0) {
                            throw new Error(`Duplicate transaction detected (Txn ID: ${txnId || chqNo})`);
                        }
                    }
                }

                // 4. Delete existing bulk pending placeholder if exists to avoid duplication
                await connection.query(`
                    DELETE FROM payments 
                    WHERE student_id = ? AND academic_year_id = ? 
                      AND (
                          (status = 'pending' AND remarks LIKE 'Auto:%' AND (paid_amount IS NULL OR paid_amount = 0))
                          OR remarks = 'Bulk Imported Fee Assignment'
                      )
                `, [studentId, activeYearId]);

                // 5. Insert Consolidated Payment / Fee Assignment Row
                await connection.query(`
                    INSERT INTO payments (
                        student_id, academic_year_id, total_payable, paid_amount, pending_amount,
                        payment_method, payment_date, transaction_id, remarks, term_no, status, fee_type,
                        cheque_no, receipt_no, discount_amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    studentId,
                    activeYearId,
                    finalTotalPayable,
                    paidVal,
                    finalBalance,
                    method,
                    payDate,
                    txnId,
                    remark,
                    1, // Term 1 by default for initial assign
                    finalBalance <= 0 ? 'paid' : 'pending',
                    'Institutional Fee',
                    chqNo,
                    receiptNo,
                    discountVal
                ]);

                // 6. Update student requires_transport if transport fee is assigned
                if (transportVal > 0) {
                    await connection.query(`
                        UPDATE student_enrollments 
                        SET requires_transport = 1 
                        WHERE student_id = ? AND academic_year_id = ?
                    `, [studentId, activeYearId]);
                    
                    // Insert a explicit Transport Fee record to lock in the exact imported amount
                    await connection.query(`
                        INSERT INTO payments (
                            student_id, academic_year_id, total_payable, paid_amount, pending_amount,
                            remarks, status, fee_type, term_no
                        ) VALUES (?, ?, ?, 0, ?, 'Bulk Imported Fee Assignment', 'pending', 'Transport Fee', 1)
                    `, [studentId, activeYearId, transportVal, transportVal]);
                }

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({
            message: "Student fee assignments bulk import completed",
            totalRows: data.length,
            inserted,
            failed: errors.length,
            errors
        });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// ── HR Bulk Imports ─────────────────────────────────────────────────────────

// 1. Bulk Import Salary Setup
export const importSalarySetup = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue;

            try {
                const empId = row.employeeid || row.empid || row.id;
                if (!empId) throw new Error("Employee ID is required");

                const [staff] = await connection.query(`SELECT id FROM staff WHERE employee_id = ?`, [empId]);
                if (staff.length === 0) throw new Error(`Staff with Employee ID ${empId} not found`);

                const staffId = staff[0].id;
                const basic = parseFloat(row.basicsalary || row.basic) || 0;
                const hra = parseFloat(row.hra) || 0;
                const da = parseFloat(row.da) || 0;
                const bonus = parseFloat(row.bonus) || 0;
                const pf = parseFloat(row.pf) || 0;
                const pt = parseFloat(row.pt) || 0;
                const esic = parseFloat(row.esic) || 0;
                const other = parseFloat(row.otherdeductions || row.other) || 0;

                await connection.query(`
                    INSERT INTO staff_salary_structures (staff_id, basic_salary, hra, da, bonus, pf, pt, esic, other_deductions)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        basic_salary      = VALUES(basic_salary),
                        hra               = VALUES(hra),
                        da                = VALUES(da),
                        bonus             = VALUES(bonus),
                        pf                = VALUES(pf),
                        pt                = VALUES(pt),
                        esic              = VALUES(esic),
                        other_deductions  = VALUES(other_deductions)
                `, [staffId, basic, hra, da, bonus, pf, pt, esic, other]);

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Salary setup import completed", totalRows: data.length, inserted, failed: errors.length, errors });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 2. Bulk Import Staff Payroll (Pending/Processing)
export const importStaffPayroll = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];
        const processedBy = req.user?.id || null;
        const now = new Date();

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue;

            try {
                const empId = row.employeeid || row.empid || row.id;
                const month = parseInt(row.month);
                const year = parseInt(row.year);

                if (!empId || !month || !year) throw new Error("Employee ID, Month, and Year are required");

                const [staff] = await connection.query(`SELECT id FROM staff WHERE employee_id = ?`, [empId]);
                if (staff.length === 0) throw new Error(`Staff with Employee ID ${empId} not found`);

                const staffId = staff[0].id;
                const basic = parseFloat(row.basicsalary || row.basic) || 0;
                const hra = parseFloat(row.hra) || 0;
                const da = parseFloat(row.da) || 0;
                const bonus = parseFloat(row.bonus) || 0;
                const pf = parseFloat(row.pf) || 0;
                const pt = parseFloat(row.pt) || 0;
                const esic = parseFloat(row.esic) || 0;
                const deductions = parseFloat(row.deductions) || 0;
                const loan_deduction = parseFloat(row.loandeduction) || 0;
                const present_days = parseFloat(row.presentdays) || 0;
                const half_days = parseFloat(row.halfdays) || 0;
                const total_days = parseFloat(row.totaldays) || 30;
                const net = parseFloat(row.netsalary) || 0;
                const status = row.status ? String(row.status).toLowerCase() : 'pending';
                let payment_date = null;
                if (status === 'paid') {
                    payment_date = row.paymentdate ? new Date(row.paymentdate) : now;
                }
                const remarks = row.remarks || null;

                await connection.query(`
                    INSERT INTO staff_payroll
                        (staff_id, month, year, basic_salary, hra, da, bonus, present_days, half_days, total_days, deductions, pf, pt, esic, loan_deduction, net_salary, status, payment_date, remarks, processed_by, processed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        basic_salary   = VALUES(basic_salary),
                        hra            = VALUES(hra),
                        da             = VALUES(da),
                        bonus          = VALUES(bonus),
                        present_days   = VALUES(present_days),
                        half_days      = VALUES(half_days),
                        total_days     = VALUES(total_days),
                        deductions     = VALUES(deductions),
                        pf             = VALUES(pf),
                        pt             = VALUES(pt),
                        esic           = VALUES(esic),
                        loan_deduction = VALUES(loan_deduction),
                        net_salary     = VALUES(net_salary),
                        status         = VALUES(status),
                        payment_date   = VALUES(payment_date),
                        remarks        = VALUES(remarks),
                        processed_by   = VALUES(processed_by),
                        processed_at   = VALUES(processed_at)
                `, [staffId, month, year, basic, hra, da, bonus, present_days, half_days, total_days, deductions, pf, pt, esic, loan_deduction, net, status, payment_date, remarks, processedBy, now]);

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Staff payroll import completed", totalRows: data.length, inserted, failed: errors.length, errors });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 3. Bulk Import Loan & Advance
export const importLoanAdvance = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue;

            try {
                const empId = row.employeeid || row.empid || row.id;
                if (!empId) throw new Error("Employee ID is required");

                const [staff] = await connection.query(`SELECT id FROM staff WHERE employee_id = ?`, [empId]);
                if (staff.length === 0) throw new Error(`Staff with Employee ID ${empId} not found`);

                const staffId = staff[0].id;
                const total_amount = parseFloat(row.totalamount) || 0;
                const emi_amount = parseFloat(row.emiamount) || 0;
                const reason = row.reason || '';

                if (total_amount <= 0) throw new Error("Total Amount must be greater than 0");

                // Check for duplicate active loan
                const [activeLoan] = await connection.query(`SELECT id FROM staff_loans WHERE staff_id = ? AND status = 'active'`, [staffId]);
                if (activeLoan.length > 0) throw new Error(`Active loan already exists for ${empId}`);

                await connection.query(`
                    INSERT INTO staff_loans (staff_id, total_amount, emi_amount, balance_amount, reason, status)
                    VALUES (?, ?, ?, ?, ?, 'active')
                `, [staffId, total_amount, emi_amount, total_amount, reason]);

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Loan and advance import completed", totalRows: data.length, inserted, failed: errors.length, errors });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 4. Bulk Import Payroll Record (Same logic as payroll but defaults status to paid)
export const importPayrollRecord = async (req, res) => {
    let connection;
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        connection = await db.getConnection();
        await connection.beginTransaction();

        let inserted = 0;
        let errors = [];
        const processedBy = req.user?.id || null;
        const now = new Date();

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = normalizeRow(rawRow);
            if (!row) continue;

            try {
                const empId = row.employeeid || row.empid || row.id;
                const month = parseInt(row.month);
                const year = parseInt(row.year);

                if (!empId || !month || !year) throw new Error("Employee ID, Month, and Year are required");

                const [staff] = await connection.query(`SELECT id FROM staff WHERE employee_id = ?`, [empId]);
                if (staff.length === 0) throw new Error(`Staff with Employee ID ${empId} not found`);

                const staffId = staff[0].id;
                const basic = parseFloat(row.basicsalary || row.basic) || 0;
                const hra = parseFloat(row.hra) || 0;
                const da = parseFloat(row.da) || 0;
                const bonus = parseFloat(row.bonus) || 0;
                const pf = parseFloat(row.pf) || 0;
                const pt = parseFloat(row.pt) || 0;
                const esic = parseFloat(row.esic) || 0;
                const deductions = parseFloat(row.deductions) || 0;
                const loan_deduction = parseFloat(row.loandeduction) || 0;
                const present_days = parseFloat(row.presentdays) || 0;
                const half_days = parseFloat(row.halfdays) || 0;
                const total_days = parseFloat(row.totaldays) || 30;
                const net = parseFloat(row.netsalary) || 0;
                const status = row.status || 'paid';
                let payment_date = row.paymentdate ? new Date(row.paymentdate) : now;
                const remarks = row.remarks || 'Imported Payroll Record';

                await connection.query(`
                    INSERT INTO staff_payroll
                        (staff_id, month, year, basic_salary, hra, da, bonus, present_days, half_days, total_days, deductions, pf, pt, esic, loan_deduction, net_salary, status, payment_date, remarks, processed_by, processed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        basic_salary   = VALUES(basic_salary),
                        hra            = VALUES(hra),
                        da             = VALUES(da),
                        bonus          = VALUES(bonus),
                        present_days   = VALUES(present_days),
                        half_days      = VALUES(half_days),
                        total_days     = VALUES(total_days),
                        deductions     = VALUES(deductions),
                        pf             = VALUES(pf),
                        pt             = VALUES(pt),
                        esic           = VALUES(esic),
                        loan_deduction = VALUES(loan_deduction),
                        net_salary     = VALUES(net_salary),
                        status         = VALUES(status),
                        payment_date   = VALUES(payment_date),
                        remarks        = VALUES(remarks),
                        processed_by   = VALUES(processed_by),
                        processed_at   = VALUES(processed_at)
                `, [staffId, month, year, basic, hra, da, bonus, present_days, half_days, total_days, deductions, pf, pt, esic, loan_deduction, net, status, payment_date, remarks, processedBy, now]);

                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Payroll record import completed", totalRows: data.length, inserted, failed: errors.length, errors });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

export const importVehicles = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                if (!row.vehicle_number || !row.route_name) {
                    throw new Error("Missing required fields (vehicle_number, route_name)");
                }

                const [existing] = await connection.query(`SELECT id FROM transport_vehicles WHERE vehicle_number = ?`, [row.vehicle_number]);
                if (existing.length > 0) {
                    throw new Error(`Vehicle ${row.vehicle_number} already exists`);
                }

                await connection.query(
                    `INSERT INTO transport_vehicles (vehicle_number, driver_name, driver_phone, route_name, capacity, status) VALUES (?, ?, ?, ?, ?, ?)`,
                    [row.vehicle_number, row.driver_name || null, row.driver_phone || null, row.route_name, row.capacity || 40, row.status || 'active']
                );
                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        fs.unlinkSync(req.file.path);
        res.json({ message: "Vehicles imported", inserted, failed: errors.length, errors });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const importTransportAssignments = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const connection = await db.getConnection();
    try {
        const { academicYearId } = req.query;
        let ayId = academicYearId;
        if (!ayId) {
            const [activeYear] = await connection.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
            ayId = activeYear[0]?.id;
        }

        await connection.beginTransaction();
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                if (!row.vehicle_number || (!row.gr_no && !row.student_id_no && !row.pen_no)) {
                    throw new Error("Missing required fields (vehicle_number, and at least one student identifier)");
                }

                const [vehicles] = await connection.query(`SELECT id FROM transport_vehicles WHERE vehicle_number = ?`, [row.vehicle_number]);
                if (vehicles.length === 0) {
                    throw new Error(`Vehicle ${row.vehicle_number} not found`);
                }
                const vehicleId = vehicles[0].id;

                let query = `SELECT id FROM students WHERE 1=1`;
                const params = [];
                
                if (row.gr_no) { query += ` AND gr_no = ?`; params.push(row.gr_no); }
                if (row.student_id_no) { query += ` AND student_id_no = ?`; params.push(row.student_id_no); }
                if (row.pen_no) { query += ` AND pen_no = ?`; params.push(row.pen_no); }
                
                const [students] = await connection.query(query, params);
                if (students.length === 0) {
                    throw new Error("Student not found matching provided identifiers");
                }
                if (students.length > 1) {
                    throw new Error("Multiple students matched - identifiers not unique");
                }
                const studentId = students[0].id;

                const [existing] = await connection.query(`SELECT id FROM transport_assignments WHERE student_id = ? AND academic_year_id = ?`, [studentId, ayId]);
                if (existing.length > 0) {
                    throw new Error("Student already assigned to a vehicle for this academic year");
                }

                await connection.query(
                    `INSERT INTO transport_assignments (vehicle_id, student_id, pickup_point, academic_year_id, status) VALUES (?, ?, ?, ?, 'active')`,
                    [vehicleId, studentId, row.pickup_point || null, ayId]
                );
                inserted++;
            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await connection.commit();
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ message: "Assignments imported", inserted, failed: errors.length, errors });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};
