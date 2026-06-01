import pool from '../config/db.js';

export const createClassroom = async (req, res) => {
    try {
        const {
            class_name, grade_level, capacity, room_number,
            class_teacher_id, class_code, floor, description,
            section, stream, academic_year_id
        } = req.body;

        const generatedCode = class_code || `${class_name?.slice(0, 3).toUpperCase()}-${room_number || Math.floor(Math.random() * 1000)}`;

        const [result] = await pool.query(
            `INSERT INTO classrooms 
            (class_name, grade_level, capacity, room_number, class_code, floor, description, section, stream, class_teacher_id, academic_year_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                class_name,
                grade_level || 0,
                capacity || 40,
                room_number || 'N/A',
                generatedCode,
                floor || 'Ground',
                description || '',
                section || null,
                stream || null,
                class_teacher_id || null,
                academic_year_id || null
            ]
        );

        const classroomId = result.insertId;

        // Associate mentor if year is provided
        if (class_teacher_id && academic_year_id) {
            await pool.query(
                `INSERT INTO classroom_mentorship (classroom_id, academic_year_id, teacher_id) VALUES (?, ?, ?)`,
                [classroomId, academic_year_id, class_teacher_id]
            );
        }

        res.status(201).json({ id: classroomId, message: 'Classroom established globally' });
    } catch (error) {
        console.error("Create Classroom Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getClassrooms = async (req, res) => {
    try {
        const { academic_year_id } = req.query;
        const yearId = academic_year_id && academic_year_id !== '' ? academic_year_id : null;

        let query = `
            SELECT c.*, COALESCE(cm.teacher_id, c.class_teacher_id) as class_teacher_id, s.full_name as teacher_name,
            (SELECT COUNT(*) FROM student_enrollments se 
             JOIN students s2 ON se.student_id = s2.id
             WHERE se.classroom_id = c.id AND (se.academic_year_id = ? OR ? IS NULL)) as student_count
            FROM classrooms c
            LEFT JOIN classroom_mentorship cm ON c.id = cm.classroom_id AND cm.academic_year_id = ?
            LEFT JOIN staff s ON COALESCE(cm.teacher_id, c.class_teacher_id) = s.id
            WHERE c.status = 'active'
        `;
        const params = [yearId, yearId, yearId];

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Get Classrooms Error:", error);
        res.status(500).json({ error: "Institutional Logic: Failed to fetch institutional hubs" });
    }
};

export const updateClassroom = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            class_name, grade_level, capacity, room_number,
            class_teacher_id, status, class_code,
            floor, description, section, stream,
            academic_year_id
        } = req.body;

        await pool.query(
            `UPDATE classrooms SET 
            class_name=?, grade_level=?, capacity=?, room_number=?, 
            status=?, class_code=?, floor=?, description=?, section=?, stream=?,
            class_teacher_id=?, academic_year_id=?
            WHERE id=?`,
            [
                class_name, grade_level, capacity, room_number,
                status || 'active', class_code, floor, description,
                section || null, stream || null,
                class_teacher_id || null, academic_year_id || null,
                id
            ]
        );

        // Sync mentor for the specific year if academic_year_id is provided
        if (academic_year_id) {
            await pool.query(
                `INSERT INTO classroom_mentorship (classroom_id, academic_year_id, teacher_id) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE teacher_id = ?`,
                [id, academic_year_id, class_teacher_id || null, class_teacher_id || null]
            );
        }

        res.json({ message: 'Classroom updated successfully' });
    } catch (error) {
        console.error("Update Classroom Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const enrollStudent = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { student_id, classroom_id, academic_year_id, roll_number, grade } = req.body;

        // 1. Check if enrollment exists
        const [existing] = await connection.query(
            'SELECT id FROM student_enrollments WHERE student_id = ? AND academic_year_id = ?',
            [student_id, academic_year_id]
        );

        if (existing.length > 0) {
            await connection.query(
                'UPDATE student_enrollments SET classroom_id = ?, roll_number = ?, grade = ?, status = "active" WHERE id = ?',
                [classroom_id, roll_number, grade, existing[0].id]
            );
        } else {
            await connection.query(
                'INSERT INTO student_enrollments (student_id, classroom_id, academic_year_id, roll_number, grade) VALUES (?, ?, ?, ?, ?)',
                [student_id, classroom_id, academic_year_id, roll_number, grade]
            );
        }

        // 2. Update admission status if applicable
        await connection.query(
            'UPDATE admission_applications SET status = "enrolled" WHERE aadhar = (SELECT aadhar_no FROM students WHERE id = ?)',
            [student_id]
        );

        await connection.commit();

        // 3. Automatic Roll Re-sync (Alphabetical by Surname)
        const autoConn = await pool.getConnection();
        try {
            await autoConn.beginTransaction();
            await reorderRollNumbers(autoConn, classroom_id, academic_year_id);
            await autoConn.commit();
        } catch (reErr) {
            console.error("Auto Roll Sync Failed:", reErr);
            await autoConn.rollback();
        } finally {
            autoConn.release();
        }

        res.json({ message: 'Student enrolled and roll numbers synchronized' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

export const getEnrolledStudents = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        const { academic_year_id } = req.query;

        let query = `
            SELECT 
                se.*, 
                s.first_name, s.last_name, s.middle_name, s.student_id_no, s.gender, s.dob,
                p.father_name as p_father_name, p.father_mobile as p_father_mobile
             FROM student_enrollments se
             JOIN students s ON se.student_id = s.id
             LEFT JOIN parents p ON s.id = p.student_id
             WHERE se.classroom_id = ?
        `;
        const params = [classroom_id];

        if (academic_year_id) {
            query += ` AND se.academic_year_id = ?`;
            params.push(academic_year_id);
        }

        const [rows] = await pool.query(query, [classroom_id, academic_year_id].filter(Boolean));

        const result = rows.map(r => ({
            ...r,
            student_name: `${(r.last_name || '').trim()} ${(r.first_name || '').trim()} ${(r.middle_name || '').trim()}`.trim().toUpperCase(),
            father_name: r.p_father_name || '---',
            father_mobile: r.p_father_mobile || '---'
        }));

        res.json(result);
    } catch (error) {
        console.error("Get Enrolled Students Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const assignSubjects = async (req, res) => {
    try {
        const { classroom_id, academic_year_id, subjects } = req.body;

        if (!academic_year_id) return res.status(400).json({ error: "Academic Year is required for subject assignment" });

        // Clear existing for this year
        await pool.query('DELETE FROM class_subjects WHERE classroom_id = ? AND academic_year_id = ?', [classroom_id, academic_year_id]);

        // Insert new
        if (subjects && subjects.length > 0) {
            const values = subjects.map(s => [classroom_id, academic_year_id, s.subject_name, s.teacher_id, s.start_time || null, s.end_time || null]);
            await pool.query(
                'INSERT INTO class_subjects (classroom_id, academic_year_id, subject_name, teacher_id, start_time, end_time) VALUES ?',
                [values]
            );
        }

        res.json({ message: 'Subjects assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getClassSubjects = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        const { academic_year_id } = req.query;

        let query = `
            SELECT cs.*, s.full_name as teacher_name 
            FROM class_subjects cs
            LEFT JOIN staff s ON cs.teacher_id = s.id
            WHERE cs.classroom_id = ?
        `;
        const params = [classroom_id];

        if (academic_year_id) {
            query += ` AND cs.academic_year_id = ?`;
            params.push(academic_year_id);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const promoteStudents = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { student_ids, next_classroom_id, next_academic_year_id, next_grade } = req.body;

        for (const student_id of student_ids) {
            const [existing] = await connection.query(
                'SELECT id FROM student_enrollments WHERE student_id = ? AND academic_year_id = ?',
                [student_id, next_academic_year_id]
            );

            if (existing.length > 0) {
                await connection.query(
                    'UPDATE student_enrollments SET classroom_id = ?, grade = ?, status = "active" WHERE id = ?',
                    [next_classroom_id, next_grade, existing[0].id]
                );
            } else {
                await connection.query(
                    'INSERT INTO student_enrollments (student_id, classroom_id, academic_year_id, grade, status) VALUES (?, ?, ?, ?, "active")',
                    [student_id, next_classroom_id, next_academic_year_id, next_grade]
                );
            }
        }

        await connection.commit();

        // 3. Automatic Roll Re-sync for Target Classroom
        const autoConn = await pool.getConnection();
        try {
            await autoConn.beginTransaction();
            await reorderRollNumbers(autoConn, next_classroom_id, next_academic_year_id);
            await autoConn.commit();
        } catch (reErr) {
            console.error("Auto Roll Sync Failed:", reErr);
            await autoConn.rollback();
        } finally {
            autoConn.release();
        }

        res.json({ message: `${student_ids.length} students promoted and roll numbers synchronized` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

export const batchCreateClassrooms = async (req, res) => {
    try {
        const { academic_year_id } = req.body;
        if (!academic_year_id) return res.status(400).json({ error: "Academic Year ID is required" });

        const standardGrades = [
            { name: 'Nursery', level: 0, code: 'NUR' },
            { name: 'Jr.Kg', level: 0, code: 'LKG' },
            { name: 'Sr.Kg', level: 0, code: 'UKG' },
            { name: '1st', level: 1, code: '1' },
            { name: '2nd', level: 2, code: '2' },
            { name: '3rd', level: 3, code: '3' },
            { name: '4th', level: 4, code: '4' },
            { name: '5th', level: 5, code: '5' },
            { name: '6th', level: 6, code: '6' },
            { name: '7th', level: 7, code: '7' },
            { name: '8th', level: 8, code: '8' },
            { name: '9th', level: 9, code: '9' },
            { name: '10th', level: 10, code: '10' }
        ];

        const values = standardGrades.map(g => [
            g.name, g.level, 40, 'TBA', g.code, 'Ground', 'System Generated'
        ]);

        await pool.query(
            `INSERT IGNORE INTO classrooms (class_name, grade_level, capacity, room_number, class_code, floor, description) 
             VALUES ?`,
            [values]
        );

        res.json({ message: 'Standard classrooms created successfully. Any existing classes were skipped.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const unenrollStudent = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        await pool.query('DELETE FROM student_enrollments WHERE id = ?', [enrollment_id]);
        res.json({ message: 'Student unenrolled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const reorderRollNumbers = async (connection, classroom_id, academic_year_id) => {
    // Fetch all students, sorting by last_name, then first_name, then middle_name
    const [students] = await connection.query(`
        SELECT se.id 
        FROM student_enrollments se
        JOIN students s ON se.student_id = s.id
        WHERE se.classroom_id = ? AND se.academic_year_id = ?
        ORDER BY s.last_name ASC, s.first_name ASC, s.middle_name ASC
    `, [classroom_id, academic_year_id]);

    // Bulk update roll numbers
    for (let i = 0; i < students.length; i++) {
        await connection.query(
            'UPDATE student_enrollments SET roll_number = ? WHERE id = ?',
            [i + 1, students[i].id]
        );
    }
    return students.length;
};

export const batchUpdateRollNumbers = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { classroom_id, academic_year_id } = req.body;

        if (!classroom_id || !academic_year_id) {
            return res.status(400).json({ error: "Classroom and Academic Year IDs are required" });
        }

        const count = await reorderRollNumbers(connection, classroom_id, academic_year_id);

        await connection.commit();
        res.json({ message: `Synchronized ${count} roll numbers alphabetically` });
    } catch (error) {
        await connection.rollback();
        console.error("Batch Roll Update Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

export const updateStudentRollNumber = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { roll_number } = req.body;

        await pool.query(
            'UPDATE student_enrollments SET roll_number = ? WHERE id = ?',
            [roll_number, enrollment_id]
        );

        res.json({ message: 'Roll number updated successfully' });
    } catch (error) {
        console.error("Update Roll Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteClassroom = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if students are enrolled
        const [enrolled] = await pool.query('SELECT COUNT(*) as count FROM student_enrollments WHERE classroom_id = ?', [id]);
        if (enrolled[0].count > 0) {
            return res.status(400).json({ error: "Cannot delete classroom with enrolled students" });
        }
        await pool.query('DELETE FROM classrooms WHERE id = ?', [id]);
        res.json({ message: 'Classroom deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
