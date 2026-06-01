import pool from '../config/db.js';

// --- Exam Management ---

export const createExam = async (req, res) => {
    try {
        const { exam_name, academic_year_id, term, start_date, end_date } = req.body;
        const [result] = await pool.query(
            'INSERT INTO exams (exam_name, academic_year_id, term, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
            [exam_name, academic_year_id, term, start_date, end_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Exam created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { exam_name, academic_year_id, term, start_date, end_date } = req.body;
        await pool.query(
            'UPDATE exams SET exam_name = ?, academic_year_id = ?, term = ?, start_date = ?, end_date = ? WHERE id = ?',
            [exam_name, academic_year_id, term, start_date, end_date, id]
        );
        res.json({ message: 'Exam updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        // Foreign key constraints should handle deleting associated settings/timetable if set to CASCADE, 
        // otherwise we need manual deletion. Assuming standard DB hygiene.
        await pool.query('DELETE FROM exams WHERE id = ?', [id]);
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getExams = async (req, res) => {
    try {
        const { academic_year_id } = req.query;
        let query = 'SELECT e.*, ay.year_name FROM exams e JOIN academic_years ay ON e.academic_year_id = ay.id';
        const params = [];
        if (academic_year_id) {
            query += ' WHERE e.academic_year_id = ?';
            params.push(academic_year_id);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateExamStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query('UPDATE exams SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Exam status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Exam Settings (Components) ---

export const saveExamSettings = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { exam_id, components } = req.body; // components: [{component_name, max_marks}]

        await connection.query('DELETE FROM exam_settings WHERE exam_id = ?', [exam_id]);

        if (components && components.length > 0) {
            const values = components.map(c => [exam_id, c.component_name, c.max_marks]);
            await connection.query(
                'INSERT INTO exam_settings (exam_id, component_name, max_marks) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Exam settings saved successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

export const getExamSettings = async (req, res) => {
    try {
        const { exam_id } = req.params;
        const [rows] = await pool.query('SELECT * FROM exam_settings WHERE exam_id = ?', [exam_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Exam Timetable ---

export const saveExamTimetable = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { exam_id, classroom_id, schedule } = req.body; // schedule: [{subject_name, exam_date, start_time, end_time, room_number}]

        await connection.query('DELETE FROM exam_timetable WHERE exam_id = ? AND classroom_id = ?', [exam_id, classroom_id]);

        if (schedule && schedule.length > 0) {
            const values = schedule.map(s => [exam_id, classroom_id, s.subject_name, s.exam_date, s.start_time, s.end_time, s.room_number]);
            await connection.query(
                'INSERT INTO exam_timetable (exam_id, classroom_id, subject_name, exam_date, start_time, end_time, room_number) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Exam timetable saved successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

export const getExamTimetable = async (req, res) => {
    try {
        const { exam_id, classroom_id } = req.query;
        let query = 'SELECT * FROM exam_timetable WHERE 1=1';
        const params = [];

        if (exam_id) {
            query += ' AND exam_id = ?';
            params.push(exam_id);
        }
        if (classroom_id) {
            query += ' AND classroom_id = ?';
            params.push(classroom_id);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Grading System ---

export const getGradingSystem = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM grading_ranges ORDER BY min_percent DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const saveGradingSystem = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { grades } = req.body; // grades: [{grade_name, min_percent, max_percent, grade_points, remark}]

        await connection.query('TRUNCATE TABLE grading_ranges');

        if (grades && grades.length > 0) {
            const values = grades.map(g => [g.grade_name, g.min_percent, g.max_percent, g.grade_points, g.remark]);
            await connection.query(
                'INSERT INTO grading_ranges (grade_name, min_percent, max_percent, grade_points, remark) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Grading system updated successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

// --- Pre-Primary Marks ---

export const getPrePrimaryMarks = async (req, res) => {
    try {
        const { student_id, term, academic_year_id } = req.query;
        let query = 'SELECT * FROM pre_primary_marks WHERE student_id = ? AND academic_year_id = ?';
        let params = [student_id, academic_year_id];

        if (term && term !== 'null' && term !== 'undefined') {
            query += ' AND term = ?';
            params.push(term);
        }

        const [rows] = await pool.query(query, params);

        if (term && term !== 'null' && term !== 'undefined') {
            res.json(rows[0] || {});
        } else {
            res.json(rows);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const savePrePrimaryMarks = async (req, res) => {
    try {
        const { studentId, term, academicYearId, marks } = req.body;

        // Define all possible fields from the UI mapping
        const fields = [
            'english_reading', 'english_writing', 'english_phonics',
            'maths_recognition', 'maths_counting', 'maths_writing',
            'hindi_reading', 'hindi_writing', 'hindi_vocabulary',
            'art_drawing', 'art_coloring', 'art_activities',
            'gk', 'sports', 'music', 'dance',
            'social', 'etiquettes', 'hygiene', 'attention', 'creativity',
            'attendance', 'total_days', 'reopening_date', 'reopening_time'
        ];

        const values = fields.map(f => marks[f] || null);

        const query = `
            INSERT INTO pre_primary_marks (
                student_id, academic_year_id, term, ${fields.join(', ')}
            ) VALUES (?, ?, ?, ${fields.map(() => '?').join(', ')})
            ON DUPLICATE KEY UPDATE 
                ${fields.map(f => `${f} = VALUES(${f})`).join(', ')}
        `;

        await pool.query(query, [studentId, academicYearId, term, ...values]);
        res.json({ message: 'Pre-Primary marks saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
