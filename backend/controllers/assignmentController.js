import pool from "../config/db.js";
import logger from "../utils/logger.js";

/**
 * Teacher: Create Assignment
 */
export const createAssignment = async (req, res) => {
    try {
        const { classroom_id, academic_year_id, subject_name, title, description, due_date, points } = req.body;
        const teacher_id = req.user.id;
        const file_url = req.file ? req.file.path.replace(/\\/g, '/') : (req.body.file_url || null);
        
        logger.info("Create Assignment Data:", { body: req.body, file: req.file, file_url });

        const [result] = await pool.query(
            `INSERT INTO assignments (teacher_id, classroom_id, academic_year_id, subject_name, title, description, due_date, points, file_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [teacher_id, classroom_id, academic_year_id || null, subject_name, title, description, due_date || null, points || 100, file_url]
        );

        res.status(201).json({ message: "Assignment Published Successfully", assignment_id: result.insertId });
    } catch (error) {
        logger.error("Create Assignment Error:", error);
        res.status(500).json({ error: "Failed to publish assignment" });
    }
};

/**
 * Teacher: Get Assignments Created by Teacher
 */
export const getTeacherAssignments = async (req, res) => {
    try {
        const teacher_id = req.user.id;
        const { academic_year_id } = req.query;

        let query = `SELECT a.*, c.class_name, c.section,
                            (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as total_submissions
                     FROM assignments a
                     JOIN classrooms c ON a.classroom_id = c.id
                     WHERE a.teacher_id = ?`;
        
        const params = [teacher_id];
        if (academic_year_id) {
            query += ` AND a.academic_year_id = ?`;
            params.push(academic_year_id);
        }
        
        query += ` ORDER BY a.created_at DESC`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error("Get Teacher Assignments Error:", error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
};

/**
 * Student/Parent: Get Assignments by Classroom
 */
export const getClassroomAssignments = async (req, res) => {
    try {
        const { classroom_id } = req.params;
        const { academic_year_id } = req.query;
        let student_id = req.user.id;

        // If parent is viewing, use the requested student_id from query
        if (req.user.role === 'parent' && req.query.student_id) {
            student_id = req.query.student_id;
        }

        let query = `SELECT a.*, s.full_name as teacher_name,
                            sub.id as submission_id, sub.submitted_at, sub.grade, sub.status as submission_status,
                            sub.submission_text, sub.file_url as submission_file_url
                     FROM assignments a
                     JOIN staff s ON a.teacher_id = s.id
                     LEFT JOIN submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
                     WHERE a.classroom_id = ?`;
        
        const params = [student_id, classroom_id];
        if (academic_year_id) {
            query += ` AND a.academic_year_id = ?`;
            params.push(academic_year_id);
        }

        query += ` ORDER BY a.created_at DESC`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error("Get Classroom Assignments Error:", error);
        res.status(500).json({ error: "Failed to fetch classroom assignments" });
    }
};

/**
 * Student: Submit Assignment
 */
export const submitAssignment = async (req, res) => {
    try {
        const { assignment_id, submission_text } = req.body;
        const student_id = req.user.id;
        const file_url = req.file ? req.file.path.replace(/\\/g, '/') : (req.body.file_url || null);

        logger.info("Submit Assignment Data:", { body: req.body, file: req.file, file_url });

        const [assignment] = await pool.query("SELECT academic_year_id FROM assignments WHERE id = ?", [assignment_id]);
        const academic_year_id = assignment[0]?.academic_year_id || null;

        const [existing] = await pool.query(
            `SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?`,
            [assignment_id, student_id]
        );

        if (existing.length > 0) {
            // Update existing submission
            await pool.query(
                `UPDATE submissions SET submission_text = ?, file_url = IF(?, ?, file_url), academic_year_id = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [submission_text, file_url ? 1 : 0, file_url, academic_year_id, existing[0].id]
            );
            return res.json({ message: "Submission Updated Successfully" });
        }

        await pool.query(
            `INSERT INTO submissions (assignment_id, student_id, submission_text, file_url, academic_year_id)
             VALUES (?, ?, ?, ?, ?)`,
            [assignment_id, student_id, submission_text, file_url, academic_year_id]
        );

        res.status(201).json({ message: "Assignment Submitted Successfully" });
    } catch (error) {
        logger.error("Submit Assignment Error:", error);
        res.status(500).json({ error: "Failed to submit assignment" });
    }
};

/**
 * Teacher: Get Submissions for an Assignment
 */
export const getAssignmentSubmissions = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        logger.info(`Fetching submissions for assignment_id: ${assignment_id}`);
        
        const [rows] = await pool.query(
            `SELECT sub.*, s.student_name, s.student_id_no, p.father_name as parent_name
             FROM submissions sub
             JOIN students s ON sub.student_id = s.id
             LEFT JOIN parents p ON p.student_id = s.id
             WHERE sub.assignment_id = ?`,
            [assignment_id]
        );
        
        logger.info(`Found ${rows.length} submissions for assignment_id: ${assignment_id}`);
        res.json(rows);
    } catch (error) {
        logger.error("Get Submissions Error:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
};

/**
 * Teacher: Grade Submission
 */
export const gradeSubmission = async (req, res) => {
    try {
        const { submission_id } = req.params;
        const { grade, feedback } = req.body;

        await pool.query(
            `UPDATE submissions SET grade = ?, feedback = ?, status = 'graded' WHERE id = ?`,
            [grade, feedback, submission_id]
        );

        res.json({ message: "Submission Graded" });
    } catch (error) {
        logger.error("Grade Submission Error:", error);
        res.status(500).json({ error: "Failed to grade submission" });
    }
};

/**
 * Teacher: Delete Submission
 */
export const deleteSubmission = async (req, res) => {
    try {
        const { submission_id } = req.params;
        await pool.query("DELETE FROM submissions WHERE id = ?", [submission_id]);
        res.json({ message: "Submission Deleted" });
    } catch (error) {
        logger.error("Delete Submission Error:", error);
        res.status(500).json({ error: "Failed to delete submission" });
    }
};

/**
 * Teacher: Update Assignment
 */
export const updateAssignment = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        const { title, description, due_date, points } = req.body;
        const file_url = req.file ? req.file.path.replace(/\\/g, '/') : null;
        
        // Build dynamic query
        let query = "UPDATE assignments SET title = ?, description = ?";
        let params = [title, description];

        // if points and due_date are provided update them (for study material they might be null)
        if (due_date !== undefined) {
            query += ", due_date = ?";
            params.push(due_date || null);
        }
        if (points !== undefined) {
            query += ", points = ?";
            params.push(points || 0);
        }
        if (file_url) {
            query += ", file_url = ?";
            params.push(file_url);
        }

        query += " WHERE id = ?";
        params.push(assignment_id);

        await pool.query(query, params);
        res.json({ message: "Updated Successfully" });
    } catch (error) {
        logger.error("Update Assignment Error:", error);
        res.status(500).json({ error: "Failed to update" });
    }
};

/**
 * Teacher: Delete Assignment
 */
export const deleteAssignment = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        await pool.query("DELETE FROM assignments WHERE id = ?", [assignment_id]);
        res.json({ message: "Deleted Successfully" });
    } catch (error) {
        logger.error("Delete Assignment Error:", error);
        res.status(500).json({ error: "Failed to delete" });
    }
};
