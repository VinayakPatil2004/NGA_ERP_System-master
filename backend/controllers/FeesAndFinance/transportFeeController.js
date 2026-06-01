import db from '../../config/db.js';
import logger from '../../utils/logger.js';

// 1. Fetch transport fees for an academic year
export const getTransportFees = async (req, res) => {
    try {
        const { academic_year_id } = req.query;
        if (!academic_year_id) return res.status(400).json({ error: "Academic Year ID required" });

        const [rows] = await db.query(
            "SELECT * FROM transport_fees WHERE academic_year_id = ?",
            [academic_year_id]
        );

        res.json(rows[0] || { transport_0_5km: 0, transport_5_7km: 0, transport_above_7km: 0 });
    } catch (error) {
        logger.error("Fetch Transport Fees Error:", error);
        res.status(500).json({ error: "Failed to fetch transport fees." });
    }
};

// 2. Save or update transport fees
export const saveTransportFees = async (req, res) => {
    try {
        const {
            academic_year_id,
            transport_0_5km,
            transport_5_7km,
            transport_above_7km
        } = req.body;

        if (!academic_year_id) return res.status(400).json({ error: "Academic Year ID required" });

        await db.query(
            `INSERT INTO transport_fees (academic_year_id, transport_0_5km, transport_5_7km, transport_above_7km)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             transport_0_5km = VALUES(transport_0_5km),
             transport_5_7km = VALUES(transport_5_7km),
             transport_above_7km = VALUES(transport_above_7km)`,
            [academic_year_id, transport_0_5km, transport_5_7km, transport_above_7km]
        );

        res.status(201).json({ message: "Transport fees updated successfully." });
    } catch (error) {
        logger.error("Save Transport Fees Error:", error);
        res.status(500).json({ error: "Failed to save transport fees." });
    }
};
