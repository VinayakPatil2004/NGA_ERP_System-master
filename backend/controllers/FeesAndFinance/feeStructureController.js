import db from '../../config/db.js';
import logger from '../../utils/logger.js';

/**
 * Controller for Institutional Fee Structure Management.
 * Handles the creation and retrieval of term-based fees for different student categories.
 */

// 1. Get Fee Structure (Flat Records)
export const getFeeStructures = async (req, res) => {
    try {
        const { academic_year_id, grade } = req.query;

        let query = "SELECT * FROM fee_structure WHERE academic_year_id = ?";
        const params = [academic_year_id];

        if (grade) {
            query += " AND grade = ?";
            params.push(grade);
        }

        query += " ORDER BY grade ASC, student_type ASC";

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error("Get Fee Structure Error:", error);
        res.status(500).json({ error: "Failed to fetch fee structures." });
    }
};

// 2. Save or Update Fee Structure (Upsert Flat Record)
export const saveFeeStructure = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { 
            academic_year_id, grade, student_type, 
            admission_fee, tuition_fee, term_fee, computer_fee, other_fee,
            transport_0_5km, transport_5_7km, transport_above_7km
        } = req.body;

        logger.info(`Saving fee structure for Grade: ${grade}, Year ID: ${academic_year_id}, Type: ${student_type}`);

        if (!academic_year_id || !grade || !student_type) {
            return res.status(400).json({ error: "Missing required fields (Year, Grade, or Student Type)." });
        }

        const query = `
            INSERT INTO fee_structure (
                academic_year_id, grade, student_type, 
                admission_fee, tuition_fee, term_fee, computer_fee, other_fee
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                admission_fee = VALUES(admission_fee),
                tuition_fee = VALUES(tuition_fee),
                term_fee = VALUES(term_fee),
                computer_fee = VALUES(computer_fee),
                other_fee = VALUES(other_fee)
        `;

        await connection.query(query, [
            academic_year_id, grade, student_type,
            parseFloat(admission_fee || 0),
            parseFloat(tuition_fee || 0),
            parseFloat(term_fee || 0),
            parseFloat(computer_fee || 0),
            parseFloat(other_fee || 0)
        ]);

        await connection.commit();
        logger.info(`Successfully updated fee structure for ${grade} (${student_type})`);
        res.status(201).json({ message: "Fee structure updated successfully." });

    } catch (error) {
        if (connection) await connection.rollback();
        logger.error("Save Fee Structure Error:", error);
        res.status(500).json({ error: "Failed to save fee structure." });
    } finally {
        if (connection) connection.release();
    }
};

// 3. Delete a specific fee entry (Optional utility)
export const deleteFeeEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM fee_structure WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Fee entry not found." });
        }

        res.json({ message: "Fee entry removed successfully." });
    } catch (error) {
        logger.error("Delete Fee Entry Error:", error);
        res.status(500).json({ error: "Failed to delete fee entry." });
    }
};


