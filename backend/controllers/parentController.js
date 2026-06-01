import pool from "../config/db.js";
import logger from "../utils/logger.js";

/**
 * Get the details of the student linked to the logged-in parent.
 */
export const getParentChildDetails = async (req, res) => {
    try {
        const parentId = req.user.id;
        
        const [parentRows] = await pool.query(
            "SELECT student_id, father_name, mother_name FROM parents WHERE id = ?", 
            [parentId]
        );
        
        if (parentRows.length === 0) {
            return res.status(404).json({ error: "Parent profile not found" });
        }
        
        const studentId = parentRows[0].student_id;
        
        const [studentRows] = await pool.query(
            `SELECT s.id, s.student_name, s.student_id_no, s.current_grade, 
                    e.classroom_id, e.section, e.roll_number, c.class_name
             FROM students s
             LEFT JOIN student_enrollments e ON s.id = e.student_id
             LEFT JOIN classrooms c ON e.classroom_id = c.id
             WHERE s.id = ?
             ORDER BY e.id DESC LIMIT 1`,
            [studentId]
        );
        
        if (studentRows.length === 0) {
            return res.status(404).json({ error: "Linked student not found" });
        }
        
        res.json({
            parent: parentRows[0],
            student: studentRows[0]
        });
    } catch (error) {
        logger.error("Get Parent Child Details Error:", error);
        res.status(500).json({ error: "Institutional service error" });
    }
};
