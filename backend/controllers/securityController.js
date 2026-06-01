import db from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Security Controller - Managing Gate Entry, Visitors, and Passes
 */

const getAcademicYearId = async (req) => {
    let id = req.query.academic_year_id || req.body.academic_year_id;
    if (id && id !== 'undefined' && id !== 'null') {
        return id;
    }
    const [rows] = await db.query(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
    return rows.length > 0 ? rows[0].id : null;
};

export const deleteVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM visitors WHERE id = ?`, [id]);
        res.json({ message: "Visitor record deleted successfully" });
    } catch (error) {
        console.error("Error deleting visitor:", error);
        res.status(500).json({ error: "Failed to delete visitor record" });
    }
};

// ─── VISITOR MANAGEMENT ──────────────────────────────────────────────────────

export const updateVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, purpose, staff_id } = req.body;
        
        await db.query(
            `UPDATE visitors SET name = ?, phone = ?, purpose = ?, staff_id = ? WHERE id = ?`,
            [name, phone, purpose, staff_id, id]
        );
        res.json({ message: "Visitor updated successfully" });
    } catch (error) {
        console.error("Error updating visitor:", error);
        res.status(500).json({ error: "Failed to update visitor" });
    }
};

export const addVisitor = async (req, res) => {
    try {
        let { name, phone, purpose, photo_url, visit_date, staff_id } = req.body;
        
        // Handle Base64 photo storage
        if (photo_url && photo_url.startsWith('data:image')) {
            try {
                const base64Data = photo_url.replace(/^data:image\/\w+;base64,/, "");
                const fileName = `${Date.now()}-visitor.jpg`;
                
                // Use a more robust way to find the uploads directory
                const uploadDir = path.resolve(__dirname, '../uploads');
                const uploadPath = path.join(uploadDir, fileName);
                
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                
                fs.writeFileSync(uploadPath, base64Data, 'base64');
                console.log(`[SECURITY] Visitor photo saved to: ${uploadPath}`);
                photo_url = `/uploads/${fileName}`;
            } catch (fsError) {
                console.error("[SECURITY] Failed to save visitor photo:", fsError);
                // Keep the base64 URL if file saving fails, so it might still show up (if DB column is LONGTEXT)
            }
        }

        const academic_year_id = await getAcademicYearId(req);
        const [result] = await db.query(
            `INSERT INTO visitors (name, phone, purpose, photo_url, visit_date, staff_id, status, academic_year_id) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [name, phone, purpose, photo_url, visit_date || new Date(), staff_id, academic_year_id]
        );

        res.json({ message: "Visitor registered. Waiting for staff approval.", id: result.insertId });
    } catch (error) {
        console.error("Error adding visitor:", error);
        res.status(500).json({ error: "Failed to register visitor" });
    }
};

export const getStaffVisitors = async (req, res) => {
    try {
        const staffId = req.user.id; // From auth middleware
        const academic_year_id = await getAcademicYearId(req);
        const [rows] = await db.query(`
            SELECT * FROM visitors 
            WHERE staff_id = ? AND status = 'pending' AND academic_year_id = ?
            ORDER BY created_at DESC
        `, [staffId, academic_year_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch pending visitors" });
    }
};

export const getStaffAllVisitors = async (req, res) => {
    try {
        const staffId = req.user.id;
        const academic_year_id = await getAcademicYearId(req);
        const [rows] = await db.query(`
            SELECT * FROM visitors 
            WHERE staff_id = ? AND academic_year_id = ?
            ORDER BY created_at DESC
        `, [staffId, academic_year_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch visitors" });
    }
};

export const getInstitutionalAllVisitors = async (req, res) => {
    try {
        const academic_year_id = await getAcademicYearId(req);
        const [rows] = await db.query(`
            SELECT v.*, s.full_name as staff_name, r.role_name as staff_role, s.designation as staff_designation,
                   ge.entry_time as entry_time, ge.exit_time as exit_time
            FROM visitors v
            LEFT JOIN staff s ON v.staff_id = s.id
            LEFT JOIN roles r ON s.role_id = r.id
            LEFT JOIN (
                SELECT person_id, MAX(entry_time) as max_entry_time
                FROM gate_entries
                WHERE entry_type = 'visitor'
                GROUP BY person_id
            ) latest_ge ON v.id = latest_ge.person_id
            LEFT JOIN gate_entries ge ON ge.person_id = latest_ge.person_id AND ge.entry_time = latest_ge.max_entry_time AND ge.entry_type = 'visitor'
            WHERE v.academic_year_id = ?
            ORDER BY v.created_at DESC
        `, [academic_year_id]);
        res.json(rows);
    } catch (error) {
        console.error("SQL Error in getInstitutionalAllVisitors:", error);
        res.status(500).json({ error: "Failed to fetch institutional visitors" });
    }
};

export const approveVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'
        
        await db.query(`UPDATE visitors SET status = ? WHERE id = ?`, [status, id]);
        res.json({ message: `Visitor ${status} successfully` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update visitor status" });
    }
};

export const getAllVisitors = async (req, res) => {
    try {
        const academic_year_id = await getAcademicYearId(req);
        const [rows] = await db.query(`
            SELECT v.*, s.full_name as staff_name,
                   ge.entry_time as entry_time, ge.exit_time as exit_time
            FROM visitors v
            LEFT JOIN staff s ON v.staff_id = s.id
            LEFT JOIN (
                SELECT person_id, MAX(entry_time) as max_entry_time
                FROM gate_entries
                WHERE entry_type = 'visitor'
                GROUP BY person_id
            ) latest_ge ON v.id = latest_ge.person_id
            LEFT JOIN gate_entries ge ON ge.person_id = latest_ge.person_id AND ge.entry_time = latest_ge.max_entry_time AND ge.entry_type = 'visitor'
            WHERE v.academic_year_id = ?
            ORDER BY v.created_at DESC
        `, [academic_year_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch visitors" });
    }
};

// ─── GATE ENTRY MANAGEMENT ───────────────────────────────────────────────────

export const updateGateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        let { person_id, remarks, photo_url } = req.body;
        
        // Handle Base64 photo storage
        if (photo_url && photo_url.startsWith('data:image')) {
            try {
                const base64Data = photo_url.replace(/^data:image\/\w+;base64,/, "");
                const fileName = `${Date.now()}-gate-entry.jpg`;
                const uploadDir = path.resolve(__dirname, '../uploads');
                const uploadPath = path.join(uploadDir, fileName);
                
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                fs.writeFileSync(uploadPath, base64Data, 'base64');
                photo_url = `/uploads/${fileName}`;
            } catch (fsError) {
                console.error("[SECURITY] Failed to save entry photo:", fsError);
            }
        }

        await db.query(
            `UPDATE gate_entries SET person_id = ?, remarks = ?, photo_url = ? WHERE id = ?`,
            [person_id, remarks, photo_url, id]
        );
        res.json({ message: "Gate entry updated successfully" });
    } catch (error) {
        console.error("Error updating gate entry:", error);
        res.status(500).json({ error: "Failed to update gate entry" });
    }
};

export const addGateEntry = async (req, res) => {
    try {
        let { entry_type, person_id, gate_pass_id, remarks, photo_url } = req.body;
        let db_person_id = person_id;

        // Handle Base64 photo storage
        if (photo_url && photo_url.startsWith('data:image')) {
            try {
                const base64Data = photo_url.replace(/^data:image\/\w+;base64,/, "");
                const fileName = `${Date.now()}-gate-entry.jpg`;
                const uploadDir = path.resolve(__dirname, '../uploads');
                const uploadPath = path.join(uploadDir, fileName);
                
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                fs.writeFileSync(uploadPath, base64Data, 'base64');
                photo_url = `/uploads/${fileName}`;
            } catch (fsError) {
                console.error("[SECURITY] Failed to save entry photo:", fsError);
            }
        }

        // 1. Verify person exists and resolve to primary key ID
        if (entry_type === 'student') {
            const [student] = await db.query(
                "SELECT id FROM students WHERE id = ? OR student_id_no = ?", 
                [person_id, person_id]
            );
            if (student.length === 0) return res.status(404).json({ error: "Student not found" });
            db_person_id = student[0].id;
        } else if (entry_type === 'staff') {
            const [staff] = await db.query(
                "SELECT id FROM staff WHERE id = ? OR employee_id = ?", 
                [person_id, person_id]
            );
            if (staff.length === 0) return res.status(404).json({ error: "Staff not found" });
            db_person_id = staff[0].id;
        } else if (entry_type === 'visitor') {
            // Check if visitor is approved
            const [[visitor]] = await db.query("SELECT status FROM visitors WHERE id = ?", [person_id]);
            if (!visitor) return res.status(404).json({ error: "Visitor not found" });
            if (visitor.status !== 'approved') return res.status(403).json({ error: "Visitor entry not approved by staff" });
        }

        const academic_year_id = await getAcademicYearId(req);
        const [result] = await db.query(
            `INSERT INTO gate_entries (entry_type, person_id, gate_pass_id, remarks, photo_url, academic_year_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [entry_type, db_person_id, gate_pass_id, remarks, photo_url, academic_year_id]
        );

        // 🔥 Feature 6: Automatic Student Attendance via Gate (Disabled per request)
        /* 
        if (entry_type === 'student') {
            try {
                const today = new Date().toISOString().split('T')[0];
                const [[enrollment]] = await db.query(`
                    SELECT se.classroom_id, se.academic_year_id 
                    FROM student_enrollments se 
                    JOIN academic_years ay ON se.academic_year_id = ay.id 
                    WHERE se.student_id = ? AND ay.is_active = 1
                    LIMIT 1
                `, [db_person_id]);

                if (enrollment) {
                    await db.query(`
                        INSERT INTO student_attendance (student_id, classroom_id, marked_by, status, date, academic_year_id, remarks)
                        VALUES (?, ?, ?, 'present', ?, ?, ?)
                        ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)
                    `, [db_person_id, enrollment.classroom_id, req.user.id, today, enrollment.academic_year_id, 'Marked via Gate Entry']);
                    
                    console.log(`Automatic attendance marked for student ${db_person_id}`);
                }
            } catch (attErr) {
                console.error("Failed to mark automatic student attendance:", attErr);
            }
        }
        */

        // 🔥 Feature 5: Real-Time Notifications
        if (entry_type === 'student') {
            notifyParent(db_person_id, `Your ward has entered the school at ${new Date().toLocaleTimeString()}`);
        }

        res.json({ message: "Entry logged successfully", id: result.insertId });
    } catch (error) {
        console.error("Error adding gate entry:", error);
        res.status(500).json({ error: "Failed to log gate entry" });
    }
};

/**
 * 🔥 Feature 5: Notification Utility Placeholder
 */
const notifyParent = async (studentId, message) => {
    try {
        const [[parent]] = await db.query(`
            SELECT father_mobile, mother_mobile FROM parents WHERE student_id = ?
        `, [studentId]);
        
        if (parent) {
            const mobile = parent.father_mobile || parent.mother_mobile;
            if (mobile) {
                console.log(`[SMS NOTIFICATION] Sent to ${mobile}: ${message}`);
                // integrate with SMS API here (e.g., Twilio, Firebase, etc.)
            }
        }
    } catch (err) {
        console.error("Notification failed:", err);
    }
};

export const updateGateExit = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            `UPDATE gate_entries SET exit_time = CURRENT_TIMESTAMP WHERE id = ? AND exit_time IS NULL`,
            [id]
        );

        if (result.affectedRows === 0) return res.status(400).json({ error: "Entry not found or already exited" });
        res.json({ message: "Exit time recorded successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to record exit time" });
    }
};

export const getGateLogs = async (req, res) => {
    try {
        const { date, type } = req.query;
        const academic_year_id = await getAcademicYearId(req);
        let query = `
            SELECT ge.*, 
                   CASE 
                       WHEN ge.entry_type = 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = ge.person_id)
                       WHEN ge.entry_type = 'staff' THEN (SELECT full_name FROM staff WHERE id = ge.person_id)
                       WHEN ge.entry_type = 'visitor' THEN (SELECT name FROM visitors WHERE id = ge.person_id)
                   END as person_name,
                   gp.qr_code as pass_qr
            FROM gate_entries ge
            LEFT JOIN gate_passes gp ON ge.gate_pass_id = gp.id
            WHERE ge.academic_year_id = ?
        `;
        const params = [academic_year_id];

        if (date) {
            query += ` AND DATE(ge.entry_time) = ?`;
            params.push(date);
        }
        if (type) {
            query += ` AND ge.entry_type = ?`;
            params.push(type);
        }

        query += ` ORDER BY ge.entry_time DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch gate logs" });
    }
};

// ─── GATE PASS SYSTEM ────────────────────────────────────────────────────────

export const requestGatePass = async (req, res) => {
    try {
        const { pass_type, person_id, reason, valid_until } = req.body;
        const qr_code = `PASS-${pass_type.toUpperCase()}-${person_id}-${Date.now()}`;
        const academic_year_id = await getAcademicYearId(req);
        
        const [result] = await db.query(
            `INSERT INTO gate_passes (pass_type, person_id, reason, valid_until, qr_code, academic_year_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [pass_type, person_id, reason, valid_until, qr_code, academic_year_id]
        );

        res.json({ message: "Gate pass requested successfully", id: result.insertId, qr_code });
    } catch (error) {
        res.status(500).json({ error: "Failed to request gate pass" });
    }
};

export const approveGatePass = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approved_by } = req.body; // status: 'approved' or 'rejected'
        
        const [result] = await db.query(
            `UPDATE gate_passes SET approval_status = ?, approved_by = ? WHERE id = ?`,
            [status, approved_by, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: "Pass not found" });
        res.json({ message: `Pass ${status} successfully` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update pass status" });
    }
};

export const verifyGatePass = async (req, res) => {
    try {
        const { qr_code } = req.query;
        
        // 1. Try finding pass by direct QR code
        let [rows] = await db.query(`
            SELECT gp.*, 
                   CASE 
                       WHEN gp.pass_type = 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = gp.person_id)
                       WHEN gp.pass_type = 'staff' THEN (SELECT full_name FROM staff WHERE id = gp.person_id)
                   END as person_name
            FROM gate_passes gp
            WHERE gp.qr_code = ?
            LIMIT 1
        `, [qr_code]);

        // 2. If not found by QR, try finding by Student/Staff ID (student_id_no / employee_id)
        if (rows.length === 0) {
            [rows] = await db.query(`
                SELECT gp.*, 
                       CASE 
                           WHEN gp.pass_type = 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = gp.person_id)
                           WHEN gp.pass_type = 'staff' THEN (SELECT full_name FROM staff WHERE id = gp.person_id)
                       END as person_name
                FROM gate_passes gp
                JOIN students s ON gp.person_id = s.id AND gp.pass_type = 'student'
                WHERE s.student_id_no = ? AND gp.approval_status = 'approved'
                ORDER BY gp.created_at DESC LIMIT 1
            `, [qr_code]);

            if (rows.length === 0) {
                [rows] = await db.query(`
                    SELECT gp.*, 
                           CASE 
                               WHEN gp.pass_type = 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = gp.person_id)
                               WHEN gp.pass_type = 'staff' THEN (SELECT full_name FROM staff WHERE id = gp.person_id)
                           END as person_name
                    FROM gate_passes gp
                    JOIN staff st ON gp.person_id = st.id AND gp.pass_type = 'staff'
                    WHERE st.employee_id = ? AND gp.approval_status = 'approved'
                    ORDER BY gp.created_at DESC LIMIT 1
                `, [qr_code]);
            }
        }

        if (rows.length === 0) return res.status(404).json({ error: "No active or approved gate pass found for this ID/QR" });
        
        const pass = rows[0];
        
        if (pass.approval_status !== 'approved') {
            return res.status(400).json({ error: "Gate pass is pending or rejected", status: pass.approval_status });
        }

        if (new Date(pass.valid_until) < new Date()) {
            return res.status(400).json({ error: "Gate pass has expired", pass });
        }

        res.json(pass);
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ error: "Failed to verify gate pass" });
    }
};

// ─── VEHICLE TRACKING ────────────────────────────────────────────────────────

export const updateVehicleLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle_no, vehicle_type, driver_name, purpose } = req.body;
        
        await db.query(
            `UPDATE vehicle_logs SET vehicle_no = ?, vehicle_type = ?, driver_name = ?, purpose = ? WHERE id = ?`,
            [vehicle_no, vehicle_type, driver_name, purpose, id]
        );
        res.json({ message: "Vehicle log updated successfully" });
    } catch (error) {
        console.error("Error updating vehicle log:", error);
        res.status(500).json({ error: "Failed to update vehicle log" });
    }
};

export const addVehicleLog = async (req, res) => {
    try {
        const { vehicle_no, vehicle_type, driver_name, purpose } = req.body;
        const academic_year_id = await getAcademicYearId(req);
        const [result] = await db.query(
            `INSERT INTO vehicle_logs (vehicle_no, vehicle_type, driver_name, purpose, academic_year_id) VALUES (?, ?, ?, ?, ?)`,
            [vehicle_no, vehicle_type, driver_name, purpose, academic_year_id]
        );
        res.json({ message: "Vehicle entry logged", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Failed to log vehicle entry" });
    }
};

export const updateVehicleExit = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`UPDATE vehicle_logs SET exit_time = CURRENT_TIMESTAMP WHERE id = ? AND exit_time IS NULL`, [id]);
        res.json({ message: "Vehicle exit logged" });
    } catch (error) {
        res.status(500).json({ error: "Failed to log vehicle exit" });
    }
};

export const getVehicleLogs = async (req, res) => {
    try {
        const academic_year_id = await getAcademicYearId(req);
        const [rows] = await db.query(`SELECT * FROM vehicle_logs WHERE academic_year_id = ? ORDER BY entry_time DESC`, [academic_year_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch vehicle logs" });
    }
};

// ─── OVERVIEW / DASHBOARD ────────────────────────────────────────────────────

export const getSecurityOverview = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const academic_year_id = await getAcademicYearId(req);
        
        const [visitorsToday] = await db.query(`SELECT COUNT(*) as count FROM visitors WHERE DATE(visit_date) = ? AND academic_year_id = ?`, [today, academic_year_id]);
        const [activeEntries] = await db.query(`SELECT COUNT(*) as count FROM gate_entries WHERE exit_time IS NULL AND academic_year_id = ?`, [academic_year_id]);
        const [pendingPasses] = await db.query(`SELECT COUNT(*) as count FROM gate_passes WHERE approval_status = 'pending' AND academic_year_id = ?`, [academic_year_id]);
        const [vehiclesIn] = await db.query(`SELECT COUNT(*) as count FROM vehicle_logs WHERE exit_time IS NULL AND academic_year_id = ?`, [academic_year_id]);

        res.json({
            visitorsToday: visitorsToday[0].count,
            activeEntries: activeEntries[0].count,
            pendingPasses: pendingPasses[0].count,
            vehiclesIn: vehiclesIn[0].count
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch security overview" });
    }
};
