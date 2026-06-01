import pool from '../config/db.js';

export const getSettings = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings LIMIT 1');
        res.json(rows[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        if (!req.user || !['admin', 'principal', 'HR'].includes(req.user.role)) {
            return res.status(403).json({ error: "Access Denied: Only administrative staff can modify system settings." });
        }

        const {
            punch_in_start, punch_in_end,
            punch_out_start, punch_out_end,
            office_latitude, office_longitude,
            office_radius, allowed_ip
        } = req.body;

        const [rows] = await pool.query('SELECT id FROM settings LIMIT 1');
        
        if (rows.length > 0) {
            await pool.query(
                `UPDATE settings SET 
                    punch_in_start = ?, punch_in_end = ?, 
                    punch_out_start = ?, punch_out_end = ?, 
                    office_latitude = ?, office_longitude = ?, 
                    office_radius = ?, allowed_ip = ?
                 WHERE id = ?`,
                [
                    punch_in_start, punch_in_end, 
                    punch_out_start, punch_out_end, 
                    office_latitude, office_longitude, 
                    office_radius, allowed_ip, 
                    rows[0].id
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO settings (
                    punch_in_start, punch_in_end, 
                    punch_out_start, punch_out_end, 
                    office_latitude, office_longitude, 
                    office_radius, allowed_ip
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    punch_in_start, punch_in_end, 
                    punch_out_start, punch_out_end, 
                    office_latitude, office_longitude, 
                    office_radius, allowed_ip
                ]
            );
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
