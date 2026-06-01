import db from '../config/db.js';

export const applyStudentLeave = async (req, res) => {
    try {
        const { student_id, academic_year_id, leave_type, from_date, to_date, days, reason } = req.body;
        
        if (!student_id || !from_date || !to_date) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const [result] = await db.query(
            `INSERT INTO student_leaves (student_id, academic_year_id, leave_type, from_date, to_date, days, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [student_id, academic_year_id, leave_type, from_date, to_date, days || 1, reason]
        );

        res.status(201).json({ message: "Leave application submitted successfully", id: result.insertId });
    } catch (error) {
        console.error("Apply student leave error:", error);
        res.status(500).json({ error: "Failed to submit leave application" });
    }
};

export const getStudentLeaves = async (req, res) => {
    try {
        const { student_id } = req.params;
        const [rows] = await db.query(
            `SELECT * FROM student_leaves WHERE student_id = ? ORDER BY applied_at DESC`,
            [student_id]
        );
        res.json(rows);
    } catch (error) {
        console.error("Get student leaves error:", error);
        res.status(500).json({ error: "Failed to fetch leave applications" });
    }
};

export const getAllStudentLeaves = async (req, res) => {
    try {
        const { status, grade } = req.query;
        let query = `
            SELECT sl.*, s.student_name, s.student_id_no, se.grade
            FROM student_leaves sl
            JOIN students s ON sl.student_id = s.id
            JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'active'
            WHERE 1=1
        `;
        const params = [];
        
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
        console.error("Get all student leaves error:", error);
        res.status(500).json({ error: "Failed to fetch leave applications" });
    }
};

export const reviewStudentLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, review_remarks } = req.body;
        const reviewed_by = req.user.id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        await db.query(
            `UPDATE student_leaves 
             SET status = ?, review_remarks = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [status, review_remarks, reviewed_by, id]
        );

        res.json({ message: `Leave ${status} successfully` });
    } catch (error) {
        console.error("Review student leave error:", error);
        res.status(500).json({ error: "Failed to review leave application" });
    }
};
