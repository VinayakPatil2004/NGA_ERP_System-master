import pool from '../config/db.js';

/**
 * Get all calendar events from the database
 */
export const getAllCalendarEvents = async (req, res) => {
    try {
        const [events] = await pool.query(`
            SELECT 
                ce.id, 
                ce.academic_year_id, 
                ce.event_type, 
                ce.title, 
                ce.description, 
                DATE_FORMAT(ce.event_date, '%Y-%m-%d') AS event_date, 
                ce.subject, 
                ce.remarks, 
                ce.created_at, 
                ce.updated_at, 
                ay.year_name 
            FROM calendar_events ce
            LEFT JOIN academic_years ay ON ce.academic_year_id = ay.id
            ORDER BY ce.event_date ASC
        `);
        res.status(200).json(events);
    } catch (error) {
        console.error("[CALENDAR CONTROLLER] Get Events Error:", error);
        res.status(500).json({ error: "Failed to retrieve calendar events" });
    }
};

/**
 * Create a new calendar event
 */
export const addCalendarEvent = async (req, res) => {
    const { academic_year_id, event_type, title, description, event_date, subject, remarks } = req.body;

    if (!event_type || !title || !event_date) {
        return res.status(400).json({ error: "Event type, title, and date are mandatory fields" });
    }

    try {
        const [result] = await pool.query(`
            INSERT INTO calendar_events (academic_year_id, event_type, title, description, event_date, subject, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            academic_year_id || null,
            event_type,
            title,
            description || null,
            event_date,
            subject || null,
            remarks || null
        ]);

        res.status(201).json({
            message: "Calendar event recorded successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error("[CALENDAR CONTROLLER] Add Event Error:", error);
        res.status(500).json({ error: "Failed to establish new calendar event" });
    }
};

/**
 * Update an existing calendar event
 */
export const updateCalendarEvent = async (req, res) => {
    const { id } = req.params;
    const { academic_year_id, event_type, title, description, event_date, subject, remarks } = req.body;

    if (!event_type || !title || !event_date) {
        return res.status(400).json({ error: "Event type, title, and date are mandatory fields" });
    }

    try {
        const [result] = await pool.query(`
            UPDATE calendar_events 
            SET academic_year_id = ?, event_type = ?, title = ?, description = ?, event_date = ?, subject = ?, remarks = ?
            WHERE id = ?
        `, [
            academic_year_id || null,
            event_type,
            title,
            description || null,
            event_date,
            subject || null,
            remarks || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Calendar event registry not found" });
        }

        res.status(200).json({ message: "Calendar event committed successfully" });
    } catch (error) {
        console.error("[CALENDAR CONTROLLER] Update Event Error:", error);
        res.status(500).json({ error: "Failed to update calendar event registry" });
    }
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM calendar_events WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Calendar event registry not found" });
        }

        res.status(200).json({ message: "Calendar event Deleted from registry" });
    } catch (error) {
        console.error("[CALENDAR CONTROLLER] Delete Event Error:", error);
        res.status(500).json({ error: "Failed to Delete calendar event from registry" });
    }
};
