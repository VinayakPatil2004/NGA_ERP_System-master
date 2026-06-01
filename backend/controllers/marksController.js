import pool from '../config/db.js';
import fs from 'fs';
import csv from 'csv-parser';

const calculateGrade = async (percentage) => {
    const [rows] = await pool.query(
        'SELECT grade_name FROM grading_ranges WHERE ? >= min_percent AND ? <= max_percent LIMIT 1',
        [percentage, percentage]
    );
    return rows.length > 0 ? rows[0].grade_name : 'E';
};

export const getMarksBatch = async (req, res) => {
    try {
        const { exam_id, classroom_id, subject_name, academic_year_id } = req.query;

        let query = `SELECT s.id, s.student_id_no, CONCAT(s.last_name, ' ', s.first_name, ' ', COALESCE(s.middle_name, '')) as student_name, se.roll_number
             FROM student_enrollments se
             JOIN students s ON se.student_id = s.id
             WHERE se.classroom_id = ?`;
        const params = [classroom_id];

        if (academic_year_id) {
            query += ` AND se.academic_year_id = ?`;
            params.push(academic_year_id);
        } else {
            query += ` AND se.status = 'active'`;
        }
        
        query += ` ORDER BY se.roll_number ASC`;

        const [students] = await pool.query(query, params);

        // Fetch existing marks
        const [marks] = await pool.query(
            'SELECT * FROM exam_marks WHERE exam_id = ? AND subject_name = ? AND student_id IN (?)',
            [exam_id, subject_name, students.map(s => s.id).concat([0])]
        );

        // Merge
        const merged = students.map(student => {
            const studentMarks = marks.find(m => m.student_id === student.id);
            return {
                ...student,
                marks: studentMarks || {
                    unit_written: 0,
                    class_test: 0,
                    project: 0,
                    oral: 0,
                    notebook: 0,
                    term_written: 0,
                    remarks: '',
                    is_draft: 1
                }
            };
        });

        res.json(merged);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const saveMarks = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { exam_id, subject_name, marks_data } = req.body; // marks_data: [{student_id, unit_written, class_test, project, oral, notebook, term_written, remarks, is_draft}]

        // Get total_max for this exam (sum of component max marks)
        const [settings] = await connection.query('SELECT SUM(max_marks) as total_max FROM exam_settings WHERE exam_id = ?', [exam_id]);
        const total_max = settings[0].total_max || 100;

        for (let row of marks_data) {
            const total_obtained = 
                parseFloat(row.unit_written || 0) + 
                parseFloat(row.class_test || 0) + 
                parseFloat(row.project || 0) + 
                parseFloat(row.oral || 0) + 
                parseFloat(row.notebook || 0) + 
                parseFloat(row.term_written || 0);
            
            const percentage = (total_obtained / total_max) * 100;
            const grade = await calculateGrade(percentage);

            const query = `
                INSERT INTO exam_marks 
                (exam_id, student_id, subject_name, unit_written, class_test, project, oral, notebook, term_written, total_obtained, total_max, percentage, grade, remarks, is_draft)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                unit_written=VALUES(unit_written), class_test=VALUES(class_test), project=VALUES(project), 
                oral=VALUES(oral), notebook=VALUES(notebook), term_written=VALUES(term_written),
                total_obtained=VALUES(total_obtained), total_max=VALUES(total_max), 
                percentage=VALUES(percentage), grade=VALUES(grade), remarks=VALUES(remarks), is_draft=VALUES(is_draft)
            `;

            await connection.query(query, [
                exam_id, row.student_id, subject_name,
                row.unit_written, row.class_test, row.project, row.oral, row.notebook, row.term_written,
                total_obtained, total_max, percentage, grade, row.remarks, row.is_draft
            ]);
        }

        await connection.commit();
        res.json({ message: 'Marks updated successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

export const getStudentPerformance = async (req, res) => {
    try {
        const { student_id, academic_year_id } = req.query;
        const [rows] = await pool.query(
            `SELECT em.*, e.exam_name, e.term
             FROM exam_marks em
             JOIN exams e ON em.exam_id = e.id
             WHERE em.student_id = ? AND e.academic_year_id = ?
             ORDER BY e.term ASC`,
            [student_id, academic_year_id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteMark = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM exam_marks WHERE id = ?', [id]);
        res.json({ message: 'Mark record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Co-Scholastic ---

export const saveCoScholastic = async (req, res) => {
    try {
        const { marks, is_draft } = req.body; 
        const draftStatus = is_draft === false ? 0 : 1;
        const values = marks.map(m => [m.student_id, m.academic_year_id, m.area_name, m.grade_term1, m.grade_term2, draftStatus]);
        
        await pool.query(
            `INSERT INTO co_scholastic_marks (student_id, academic_year_id, area_name, grade_term1, grade_term2, is_draft)
             VALUES ?
             ON DUPLICATE KEY UPDATE 
             grade_term1 = VALUES(grade_term1), grade_term2 = VALUES(grade_term2), is_draft = VALUES(is_draft)`,
            [values]
        );
        res.json({ message: 'Co-scholastic marks updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCoScholastic = async (req, res) => {
    try {
        const { student_id, academic_year_id } = req.query;
        
        let query = 'SELECT * FROM co_scholastic_marks WHERE academic_year_id = ?';
        let params = [academic_year_id];

        if (student_id && student_id !== 'null') {
            query += ' AND student_id = ?';
            params.push(student_id);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Bulk Upload ---

export const downloadMarksTemplate = async (req, res) => {
    try {
        const { classroom_id } = req.query;
        const [students] = await pool.query(
            `SELECT s.id as student_id, CONCAT(s.last_name, ', ', s.first_name) as student_name, se.roll_number
             FROM student_enrollments se
             JOIN students s ON se.student_id = s.id
             WHERE se.classroom_id = ? AND se.status = 'active'
             ORDER BY se.roll_number ASC`,
            [classroom_id]
        );

        let csvContent = "student_id,student_name,roll_number,unit_written,class_test,project,oral,notebook,term_written,remarks\n";
        students.forEach(s => {
            csvContent += `${s.student_id},"${s.student_name}",${s.roll_number || ''},0,0,0,0,0,0,""\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=marks_template.csv');
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const bulkUploadMarks = async (req, res) => {
    const { exam_id, subject_name } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const results = [];
    fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                const [settings] = await connection.query('SELECT SUM(max_marks) as total_max FROM exam_settings WHERE exam_id = ?', [exam_id]);
                const total_max = settings[0].total_max || 100;

                for (let row of results) {
                    const total_obtained = 
                        parseFloat(row.unit_written || 0) + 
                        parseFloat(row.class_test || 0) + 
                        parseFloat(row.project || 0) + 
                        parseFloat(row.oral || 0) + 
                        parseFloat(row.notebook || 0) + 
                        parseFloat(row.term_written || 0);
                    
                    const percentage = (total_obtained / total_max) * 100;
                    const grade = await calculateGrade(percentage);

                    const query = `
                        INSERT INTO exam_marks 
                        (exam_id, student_id, subject_name, unit_written, class_test, project, oral, notebook, term_written, total_obtained, total_max, percentage, grade, remarks, is_draft)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                        ON DUPLICATE KEY UPDATE 
                        unit_written=VALUES(unit_written), class_test=VALUES(class_test), project=VALUES(project), 
                        oral=VALUES(oral), notebook=VALUES(notebook), term_written=VALUES(term_written),
                        total_obtained=VALUES(total_obtained), total_max=VALUES(total_max), 
                        percentage=VALUES(percentage), grade=VALUES(grade), remarks=VALUES(remarks)
                    `;

                    await connection.query(query, [
                        exam_id, row.student_id, subject_name,
                        row.unit_written, row.class_test, row.project, row.oral, row.notebook, row.term_written,
                        total_obtained, total_max, percentage, grade, row.remarks
                    ]);
                }

                await connection.commit();
                res.json({ message: `${results.length} records processed successfully` });
            } catch (error) {
                await connection.rollback();
                res.status(500).json({ error: error.message });
            } finally {
                connection.release();
                fs.unlinkSync(file.path); // Clean up
            }
        });
};
