import pool from '../../config/db.js';

/**
 * Record a new CA Finance Report document
 */
export const createCAReport = async (req, res) => {
    try {
        const { 
            document_date, document_name, document_number, 
            category, description, status, academic_year_id
        } = req.body;
        
        // Handle file upload
        const attachment_url = req.file ? req.file.filename : req.body.attachment_url;
        
        // Generate a unique Report ID: CA-YEAR-RANDOM
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(1000 + Math.random() * 9000);
        const report_id = `CA-${year}-${random}`;

        const [result] = await pool.execute(
            `INSERT INTO ca_finance_reports (
                report_id, document_date, document_name, document_number, 
                category, description, status, attachment_url, academic_year_id
             ) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                report_id, document_date, document_name, document_number, 
                category, description || '', status || 'pending', attachment_url || '', academic_year_id || null
            ]
        );

        res.status(201).json({ message: 'CA Report recorded successfully', id: result.insertId, report_id });
    } catch (error) {
        console.error('Error creating CA report:', error);
        res.status(500).json({ message: 'Database error', error: error.message });
    }
};

/**
 * Fetch CA Finance Reports with optional search
 */
export const getCAReports = async (req, res) => {
    try {
        const { search, academicYearId } = req.query;

        let query = `SELECT * FROM ca_finance_reports WHERE 1=1`;
        const params = [];

        if (academicYearId) {
            query += ` AND academic_year_id = ?`;
            params.push(academicYearId);
        }

        if (search) {
            query += ` AND (document_name LIKE ? OR document_number LIKE ? OR report_id LIKE ?)`;
            const searchVal = `%${search}%`;
            params.push(searchVal, searchVal, searchVal);
        }

        query += ` ORDER BY document_date DESC`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching CA reports:', error);
        res.status(500).json({ message: 'Database error' });
    }
};

/**
 * Update an existing CA Finance Report
 */
export const updateCAReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            document_date, document_name, document_number, 
            category, description, status 
        } = req.body;

        // Handle file upload check
        let attachment_url = req.body.attachment_url;
        if (req.file) {
            attachment_url = req.file.filename;
        }

        await pool.execute(
            `UPDATE ca_finance_reports SET 
                document_date=?, document_name=?, document_number=?, 
                category=?, description=?, status=?, attachment_url=?
             WHERE id=?`,
            [
                document_date, document_name, document_number, 
                category, description || '', status, attachment_url || '',
                id
            ]
        );

        res.status(200).json({ message: 'CA Report updated successfully' });
    } catch (error) {
        console.error('Error updating CA report:', error);
        res.status(500).json({ message: 'Database error' });
    }
};

/**
 * Delete a CA Report record
 */
export const deleteCAReport = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute(`DELETE FROM ca_finance_reports WHERE id=?`, [id]);
        res.status(200).json({ message: 'CA Report record deleted' });
    } catch (error) {
        console.error('Error deleting CA report:', error);
        res.status(500).json({ message: 'Database error' });
    }
};
