// controllers/teacherController.js
import pool from "../config/db.js";
import jwt from "jsonwebtoken"; // ✅ ADD THIS
import logger from "../utils/logger.js";

// ✅ 0. Teacher Login (ADD THIS FUNCTION)
export const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      `SELECT s.*, r.role_name 
       FROM staff s 
       JOIN roles r ON s.role_id = r.id 
       WHERE s.email = ? AND r.role_name = 'teacher'`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Teacher not found" });
    }

    const teacher = rows[0];

    if (teacher.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      {
        id: teacher.id,
        role: "teacher"
      },
      process.env.JWT_SECRET || 'grace_erp_secret_key_2026',
      { expiresIn: "1d" }
    );

    res.json({
      token,
      teacher: {
        id: teacher.id,
        full_name: teacher.full_name,
        email: teacher.email
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);   // ✅ SHOW FULL ERROR
    res.status(500).json({
      message: err.message
    });
  }
};



// ✅ 1. Get Profile + Classes + Subjects
export const getTeacherProfile = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { academic_year_id } = req.query;

    const [teacher] = await pool.query(
      `SELECT s.id, s.full_name, s.email, s.subjects as expertise, r.role_name 
       FROM staff s 
       JOIN roles r ON s.role_id = r.id 
       WHERE s.id = ? AND r.role_name = 'teacher'`,
      [staffId]
    );

    if (teacher.length === 0) {
      return res.status(404).json({ error: "Teacher profile not found" });
    }

    // Determine target academic year
    let targetAY = academic_year_id;
    if (!targetAY) {
      const [activeAY] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
      targetAY = activeAY[0]?.id;
    }

    // Fetch classes for the target academic year
    const [classes] = await pool.query(
      `SELECT DISTINCT c.id as classroom_id, c.class_name, c.section,
               CASE WHEN COALESCE(cm.teacher_id, c.class_teacher_id) = ? THEN 1 ELSE 0 END as is_class_teacher
       FROM classrooms c
       LEFT JOIN classroom_mentorship cm ON c.id = cm.classroom_id 
          AND cm.academic_year_id = ?
       LEFT JOIN class_subjects cs ON cs.classroom_id = c.id AND cs.academic_year_id = ?
       WHERE (cm.teacher_id = ? OR cs.teacher_id = ? OR c.class_teacher_id = ?)`,
      [staffId, targetAY, targetAY, staffId, staffId, staffId]
    );

    // Fetch specific subjects taught by this teacher
    const [subjectsTaught] = await pool.query(
      `SELECT cs.subject_name, c.class_name, c.section, cs.start_time, cs.end_time, cs.classroom_id
       FROM class_subjects cs
       JOIN classrooms c ON cs.classroom_id = c.id
       WHERE cs.teacher_id = ? AND cs.academic_year_id = ?`,
      [staffId, targetAY]
    );

    res.json({
      teacher: teacher[0],
      classes,
      subjectsTaught
    });

  } catch (err) {
    logger.error("Error fetching teacher profile:", err);
    res.status(500).json({ error: "Institutional service error" });
  }
};

// ✅ 2. Post Announcement (Legacy / Single String)
export const postAnnouncement = async (req, res) => {
  try {
    const { message, academic_year_id } = req.body;
    const teacherId = req.user.id;

    await pool.query(
      "INSERT INTO announcements (teacher_id, description, academic_year_id, sender_name) VALUES (?, ?, ?, (SELECT full_name FROM staff WHERE id = ?))",
      [teacherId, message, academic_year_id || null, teacherId]
    );

    res.json({ message: "Announcement posted" });

  } catch (err) {
    res.status(500).json(err);
  }
};

// 3. Get Announcements (Global Broadcasts)
export const getAnnouncements = async (req, res) => {
  try {
    const { academic_year_id } = req.query;
    let yearId = academic_year_id;
    if (!yearId) {
        const [activeYear] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
        yearId = activeYear[0]?.id;
    }

    let query = "SELECT * FROM announcements";
    const params = [];

    if (yearId) {
        query += " WHERE academic_year_id = ?";
        params.push(yearId);
    }

    query += " ORDER BY created_at DESC LIMIT 10";

    const [data] = await pool.query(query, params);
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};

// 3.1 Get Notices (Role-Targeted: Teacher or All)
export const getNotices = async (req, res) => {
  try {
    const { academic_year_id } = req.query;
    let yearId = academic_year_id;
    if (!yearId) {
        const [activeYear] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
        yearId = activeYear[0]?.id;
    }

    // Get notices targeted towards teachers, staff, or all
    let query = "SELECT * FROM notices WHERE (audience LIKE '%teacher%' OR audience LIKE '%staff%' OR audience LIKE '%all%')";
    const params = [];

    if (yearId) {
        query += " AND academic_year_id = ?";
        params.push(yearId);
    }

    query += " ORDER BY created_at DESC LIMIT 10";

    const [data] = await pool.query(query, params);
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};

//  4. Create Assignment
export const createAssignment = async (req, res) => {
  try {
    const { title } = req.body;
    const teacherId = req.user.id;

    await pool.query(
      "INSERT INTO assignments (teacher_id, title) VALUES (?, ?)",
      [teacherId, title]
    );

    res.json({ message: "Assignment created" });

  } catch (err) {
    res.status(500).json(err);
  }
};

//  5. Get Assignments
export const getAssignments = async (req, res) => {
  try {
    const [data] = await pool.query(
      "SELECT * FROM assignments ORDER BY created_at DESC"
    );

    res.json(data);

  } catch (err) {
    console.log("LOGIN ERROR:", err);   //  SHOW FULL ERROR
    res.status(500).json({
      message: err.message
    });
  }
};