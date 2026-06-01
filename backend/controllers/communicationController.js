import db from '../config/db.js';
import { sendEmail } from '../utils/emailService.js';
import { sendSMS } from '../utils/smsService.js';

/**
 * Institutional Communication Controller
 * Handles internal messaging, global announcements, email/sms broadcasts, circulars and system alerts.
 */

// ── Messaging ───────────────────────────────────────────────────────────────

export const sendMessage = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { sender_id, sender_type, title, content, attachment_url, priority, target_group, target_id, academic_year_id } = req.body;

        // 1. Log the main communication record
        const [commResult] = await connection.query(
            `INSERT INTO communications (sender_id, sender_type, title, content, attachment_url, priority, category, target_group, target_id, academic_year_id) 
             VALUES (?, ?, ?, ?, ?, ?, 'message', ?, ?, ?)`,
            [sender_id, sender_type, title, content, attachment_url || null, priority || 'medium', target_group, target_id || null, academic_year_id || null]
        );
        const communicationId = commResult.insertId;

        // 2. Resolve Recipients
        let recipients = [];

        if (target_group === 'individual') {
            const [type, id] = target_id.split(':'); // Format: "staff:12" or "student:5"
            recipients.push({ id: id, type: type });
        } 
        else if (target_group === 'staff') {
            const [rows] = await connection.query('SELECT id FROM staff');
            rows.forEach(r => recipients.push({ id: r.id, type: 'staff' }));
        } 
        else if (target_group === 'student') {
            const [rows] = await connection.query("SELECT id FROM students WHERE status = 'active'");
            rows.forEach(r => recipients.push({ id: r.id, type: 'student' }));
        } 
        else if (target_group === 'parent') {
            const [rows] = await connection.query('SELECT id FROM parents');
            rows.forEach(r => recipients.push({ id: r.id, type: 'parent' }));
        } 
        else if (target_group === 'class') {
            // target_id is the grade name (e.g., "5th")
            const [rows] = await connection.query(`
                SELECT s.id 
                FROM students s 
                JOIN student_enrollments se ON s.id = se.student_id 
                WHERE se.grade = ? AND se.status = 'active'
            `, [target_id]);
            rows.forEach(r => recipients.push({ id: r.id, type: 'student' }));
        }
        else if (target_group === 'all') {
            const [staff] = await connection.query('SELECT id FROM staff');
            const [students] = await connection.query("SELECT id FROM students WHERE status = 'active'");
            const [parents] = await connection.query('SELECT id FROM parents');
            
            staff.forEach(r => recipients.push({ id: r.id, type: 'staff' }));
            students.forEach(r => recipients.push({ id: r.id, type: 'student' }));
            parents.forEach(r => recipients.push({ id: r.id, type: 'parent' }));
        }

        // 3. Populate Recipients Table
        if (recipients.length > 0) {
            const values = recipients.map(r => [communicationId, r.id, r.type]);
            await connection.query(
                `INSERT INTO communication_recipients (communication_id, recipient_id, recipient_type) VALUES ?`,
                [values]
            );
        }

        await connection.commit();
        res.json({ message: "Communication dispatched successfully", count: recipients.length });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Communication Dispatch Error:", error);
        res.status(500).json({ error: "Failed to dispatch communication" });
    } finally {
        if (connection) connection.release();
    }
};

export const getInbox = async (req, res) => {
    try {
        const { id, type, academic_year_id } = req.query;
        let query = `
            SELECT c.*, cr.is_read, cr.id as recipient_entry_id
            FROM communications c
            JOIN communication_recipients cr ON c.id = cr.communication_id
            WHERE cr.recipient_id = ? AND cr.recipient_type = ?
        `;
        const params = [id, type];
        if (academic_year_id) {
            query += " AND c.academic_year_id = ?";
            params.push(academic_year_id);
        }
        query += " ORDER BY c.created_at DESC";
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch inbox" });
    }
};

export const getOutbox = async (req, res) => {
    try {
        const { senderId, senderType, academic_year_id } = req.query;
        let query = "SELECT * FROM communications WHERE sender_id = ? AND sender_type = ?";
        const params = [senderId, senderType];
        if (academic_year_id) {
            query += " AND academic_year_id = ?";
            params.push(academic_year_id);
        }
        query += " ORDER BY created_at DESC";
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch outbox" });
    }
};

// ── Email & SMS Broadcasts ───────────────────────────────────────────────────

export const sendEmailBroadcast = async (req, res) => {
    try {
        const { target_emails, subject, message, sender_id, sender_type } = req.body;
        
        if (!target_emails || target_emails.length === 0) {
            return res.status(400).json({ error: "No recipients provided" });
        }

        const emailResult = await sendEmail(target_emails, subject, message);

        if (emailResult.success) {
            // Log to database
            const [commResult] = await db.query(
                `INSERT INTO communications (sender_id, sender_type, title, content, priority, category, target_group) 
                 VALUES (?, ?, ?, ?, 'medium', 'email', 'all')`,
                [sender_id || null, sender_type || 'admin', subject, message]
            );
            
            await db.query(
                `INSERT INTO communication_logs (communication_id, channel, recipient_email, status, sent_at) VALUES ?`,
                [target_emails.map(email => [commResult.insertId, 'email', email, 'sent', new Date()])]
            );

            res.json({ message: "Email broadcast sent successfully", count: target_emails.length });
        } else {
            res.status(500).json({ error: "Email delivery failed", details: emailResult.error });
        }
    } catch (error) {
        console.error("Email Broadcast Error:", error);
        res.status(500).json({ error: "Failed to send email broadcast" });
    }
};

export const sendSMSBroadcast = async (req, res) => {
    try {
        const { target_numbers, message, sender_id, sender_type } = req.body;
        
        if (!target_numbers || target_numbers.length === 0) {
            return res.status(400).json({ error: "No recipients provided" });
        }

        const smsResult = await sendSMS(target_numbers, message);

        if (smsResult.success) {
            // Log to database
            const [commResult] = await db.query(
                `INSERT INTO communications (sender_id, sender_type, title, content, priority, category, target_group) 
                 VALUES (?, ?, ?, ?, 'medium', 'sms', 'all')`,
                [sender_id || null, sender_type || 'admin', 'SMS Broadcast', message]
            );
            
            await db.query(
                `INSERT INTO communication_logs (communication_id, channel, recipient_mobile, status, sent_at) VALUES ?`,
                [target_numbers.map(num => [commResult.insertId, 'sms', num, 'sent', new Date()])]
            );

            res.json({ message: "SMS broadcast sent successfully", count: target_numbers.length });
        } else {
            res.status(500).json({ error: "SMS delivery failed", details: smsResult.error });
        }
    } catch (error) {
        console.error("SMS Broadcast Error:", error);
        res.status(500).json({ error: "Failed to send SMS broadcast" });
    }
};


// ── Announcements ───────────────────────────────────────────────────────────

export const createAnnouncement = async (req, res) => {
    try {
        const { title, category, description, priority, audience, publish_date, expiry_date, publish_time, auto_publish, sender_id, sender_type, sender_name, academic_year_id } = req.body;
        
        const attachment_url = req.file ? `/uploads/${req.file.filename}` : req.body.attachment_url || null;

        let audience_val = audience;
        if (audience_val && typeof audience_val !== 'string') {
            audience_val = JSON.stringify(audience_val);
        }

        // Generate notice_number 0001 format
        const [lastNotice] = await db.query("SELECT id FROM notices ORDER BY id DESC LIMIT 1");
        const nextId = lastNotice.length > 0 ? lastNotice[0].id + 1 : 1;
        const notice_number = String(nextId).padStart(4, '0');

        await db.query(
            "INSERT INTO notices (notice_number, title, category, description, priority, audience, publish_date, expiry_date, publish_time, auto_publish, attachment_url, sender_id, sender_type, sender_name, academic_year_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [notice_number, title, category, description, priority || 'Medium', audience_val || null, publish_date || null, expiry_date || null, publish_time || null, auto_publish || 0, attachment_url, sender_id || null, sender_type || 'admin', sender_name || 'Administrator', academic_year_id || null]
        );
        res.json({ message: "Notice published successfully ✓" });
    } catch (error) {
        console.error("Create Notice Error:", error);
        res.status(500).json({ error: "Failed to publish notice" });
    }
};

export const getActiveAnnouncements = async (req, res) => {
    try {
        const { academic_year_id, target_audience } = req.query;
        let yearId = academic_year_id;
        if (!yearId) {
            const [activeYear] = await db.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
            yearId = activeYear[0]?.id;
        }

        let query = "SELECT * FROM notices WHERE 1=1";
        const params = [];

        if (yearId) {
            query += " AND academic_year_id = ?";
            params.push(yearId);
        }

        query += " ORDER BY created_at DESC";

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Fetch Notices Error:", error);
        res.status(500).json({ error: "Failed to fetch notices" });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM notices WHERE id = ?", [id]);
        res.json({ message: "Notice removed ✓" });
    } catch (error) {
        res.status(500).json({ error: "Deletion failed" });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, description, priority, audience, publish_date, expiry_date, publish_time, auto_publish, academic_year_id } = req.body;
        
        let attachment_url = req.body.attachment_url || null;
        if (req.file) {
            attachment_url = `/uploads/${req.file.filename}`;
        }

        let audience_val = audience;
        if (audience_val && typeof audience_val !== 'string') {
            audience_val = JSON.stringify(audience_val);
        }

        await db.query(
            "UPDATE notices SET title = ?, category = ?, description = ?, priority = ?, audience = ?, publish_date = ?, expiry_date = ?, publish_time = ?, auto_publish = ?, attachment_url = COALESCE(?, attachment_url), academic_year_id = ? WHERE id = ?",
            [title, category, description, priority, audience_val, publish_date, expiry_date, publish_time, auto_publish || 0, attachment_url, academic_year_id || null, id]
        );
        res.json({ message: "Notice updated successfully ✓" });
    } catch (error) {
        console.error("Update Notice Error:", error);
        res.status(500).json({ error: "Failed to update notice" });
    }
};


// ── Circulars (PDF/Documents) ────────────────────────────────────────────────

export const uploadCircular = async (req, res) => {
    try {
        const { title, description, target_audience, academic_year_id, uploaded_by } = req.body;
        const file_url = req.file ? `/uploads/${req.file.filename}` : null;

        if (!file_url) {
            return res.status(400).json({ error: "Document file is required" });
        }

        await db.query(
            "INSERT INTO circulars (title, description, file_url, target_audience, uploaded_by, academic_year_id) VALUES (?, ?, ?, ?, ?, ?)",
            [title, description || '', file_url, target_audience || 'all', uploaded_by || null, academic_year_id || null]
        );
        res.json({ message: "Circular uploaded successfully" });
    } catch (error) {
        console.error("Circular Upload Error:", error);
        res.status(500).json({ error: "Failed to upload circular" });
    }
};

export const getCirculars = async (req, res) => {
    try {
        const { academic_year_id, target_audience } = req.query;
        let query = "SELECT c.*, s.full_name as uploader_name FROM circulars c LEFT JOIN staff s ON c.uploaded_by = s.id WHERE 1=1";
        const params = [];

        if (academic_year_id) {
            query += " AND c.academic_year_id = ?";
            params.push(academic_year_id);
        }

        if (target_audience && target_audience !== 'all') {
            query += " AND (c.target_audience = 'all' OR c.target_audience = ?)";
            params.push(target_audience);
        }

        query += " ORDER BY c.created_at DESC";

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Fetch Circulars Error:", error);
        res.status(500).json({ error: "Failed to fetch circulars" });
    }
};

export const deleteCircular = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM circulars WHERE id = ?", [id]);
        res.json({ message: "Circular removed" });
    } catch (error) {
        res.status(500).json({ error: "Circular deletion failed" });
    }
};


// ── Notifications ───────────────────────────────────────────────────────────

export const markAsRead = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid notification ID" });
        }
        await db.query("UPDATE communication_recipients SET is_read = 1, read_at = NOW() WHERE id = ?", [id]);
        res.json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ error: "Operation failed" });
    }
};
