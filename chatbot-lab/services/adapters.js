import pool from "../../backend/config/db.js";

/**
 * 📊 AttendanceAdapter — Read-only attendance summary
 */
export const AttendanceAdapter = {
    getSummaryByStudent: async (studentId, academicYearId) => {
        const [rows] = await pool.query(
            `SELECT status, COUNT(*) as count 
             FROM student_attendance 
             WHERE student_id = ? AND academic_year_id = ? 
             GROUP BY status`,
            [studentId, academicYearId]
        );
        
        let present = 0;
        let absent = 0;
        let late = 0;
        
        rows.forEach(r => {
            if (r.status === 'present') present = r.count;
            if (r.status === 'absent') absent = r.count;
            if (r.status === 'late') late = r.count;
        });
        
        const total = present + absent + late;
        const rate = total > 0 ? ((present + late) / total * 100).toFixed(1) : "0.0";
        
        return { present, absent, late, total, rate };
    }
};

/**
 * 📅 ExamAdapter — Read-only future exams
 */
export const ExamAdapter = {
    getUpcoming: async (academicYearId) => {
        const [rows] = await pool.query(
            `SELECT exam_name, start_date, end_date, term 
             FROM exams 
             WHERE academic_year_id = ? AND start_date >= CURDATE() 
             ORDER BY start_date ASC`,
            [academicYearId]
        );
        return rows;
    }
};

/**
 * 🏆 ResultAdapter — Read-only examination grades
 */
export const ResultAdapter = {
    getStudentMarks: async (studentId, academicYearId) => {
        const [rows] = await pool.query(
            `SELECT subject_name, total_obtained, total_max, grade, remarks 
             FROM exam_marks 
             WHERE student_id = ? AND academic_year_id = ?`,
            [studentId, academicYearId]
        );
        return rows;
    }
};

/**
 * 💰 FeeAdapter — Read-only financial installments
 */
export const FeeAdapter = {
    getPendingFees: async (studentId, academicYearId) => {
        const [rows] = await pool.query(
            `SELECT fee_type, total_amount, paid_amount, due_date, status 
             FROM student_fees 
             WHERE student_id = ? 
               AND academic_year_id = ? 
               AND status IN ('pending', 'partially_paid', 'overdue') 
             ORDER BY due_date ASC`,
            [studentId, academicYearId]
        );
        
        let totalPending = 0;
        rows.forEach(r => {
            totalPending += (r.total_amount - r.paid_amount);
        });
        
        return { list: rows, totalPending };
    }
};

/**
 * 📢 NotificationAdapter — Read-only notices & announcements
 */
export const NotificationAdapter = {
    getNoticeboard: async (role, academicYearId) => {
        const [rows] = await pool.query(
            `SELECT title, description, created_at 
             FROM notices 
             WHERE (target_role = ? OR target_role = 'all') 
               AND (academic_year_id = ? OR academic_year_id IS NULL) 
             ORDER BY created_at DESC 
             LIMIT 5`,
            [role, academicYearId]
        );
        return rows;
    }
};

/**
 * 📆 TimetableAdapter — Read-only lecture slots
 */
export const TimetableAdapter = {
    getClassTimetable: async (classroomId, academicYearId) => {
        const [rows] = await pool.query(
            `SELECT subject_name, day_of_week, start_time, end_time 
             FROM class_subjects 
             WHERE classroom_id = ? AND academic_year_id = ? 
             ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')`,
            [classroomId, academicYearId]
        );
        return rows;
    }
};
