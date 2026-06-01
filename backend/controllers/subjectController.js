import pool from '../config/db.js';

export const getSubjects = async (req, res) => {
    try {
        let query = "SELECT * FROM subjects WHERE status = 'active' ORDER BY subject_name ASC";
        let params = [];

        // If authenticated user is a teacher, filter subjects to only return their assigned ones
        if (req.user && req.user.role === 'teacher') {
            let yearId = req.query.academic_year_id;
            if (!yearId) {
                const [activeYear] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
                yearId = activeYear[0]?.id;
            }

            const [assigned] = await pool.query(
                "SELECT DISTINCT subject_name FROM class_subjects WHERE teacher_id = ? AND academic_year_id = ?",
                [req.user.id, yearId]
            );
            
            if (assigned.length > 0) {
                const names = assigned.map(a => a.subject_name);
                query = "SELECT * FROM subjects WHERE status = 'active' AND subject_name IN (?) ORDER BY subject_name ASC";
                params = [names];
            } else {
                return res.json([]);
            }
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Get Subjects Error:", error);
        res.status(500).json({ error: error.message });
    }
};


export const addSubject = async (req, res) => {
    try {
        const { subject_name, category } = req.body;
        await pool.query("INSERT INTO subjects (subject_name, category) VALUES (?, ?)", [subject_name, category || 'Scholastic']);
        res.status(201).json({ message: "Subject added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
