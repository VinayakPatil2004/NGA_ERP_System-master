import pool from '../../config/db.js';

/**
 * Record a new institutional expense
 */
export const createExpense = async (req, res) => {
    try {
        const { 
            category, subcategory, amount, payment_date, payment_method, 
            vendor_name, description, status,
            reference_no, payer_name, payee_name, academic_year_id
        } = req.body;
        const recorded_by = req.user.id;

        // Handle file upload
        const attachment_url = req.file ? req.file.filename : req.body.attachment_url;
        
        const sanitizedAmount = parseFloat(amount) || 0.00;
        
        // Generate a unique Expense ID: EXP-YEAR-RANDOM
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(1000 + Math.random() * 9000);
        const expense_id = `EXP-${year}-${random}`;

        const [result] = await pool.execute(
            `INSERT INTO expenses (
                expense_id, category, subcategory, amount, payment_date, payment_method, 
                vendor_name, description, status, recorded_by,
                reference_no, payer_name, payee_name, attachment_url, academic_year_id
             ) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                expense_id, category, subcategory, sanitizedAmount, payment_date, payment_method, 
                vendor_name, description, status || 'pending', recorded_by,
                reference_no, payer_name, payee_name, attachment_url || '', academic_year_id || null
            ]
        );

        res.status(201).json({ message: 'Expense recorded successfully', id: result.insertId, expense_id });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: 'Database error', error: error.message });
    }
};

/**
 * Fetch institutional expenses with filters
 */
export const getExpenses = async (req, res) => {
    try {
        const { category, startDate, endDate, academicYearId } = req.query;

        let query = `SELECT * FROM expenses WHERE 1=1`;
        const params = [];

        if (academicYearId) {
            query += ` AND academic_year_id = ?`;
            params.push(academicYearId);
        }

        if (category && category !== 'All') {
            query += ` AND category = ?`;
            params.push(category);
        }

        if (startDate && endDate) {
            query += ` AND payment_date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY payment_date DESC`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Database error' });
    }
};

/**
 * Update an existing expense
 */
export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            category, subcategory, amount, payment_date, payment_method, 
            vendor_name, description, status,
            reference_no, payer_name, payee_name 
        } = req.body;

        const sanitizedAmount = parseFloat(amount) || 0.00;

        // Handle file upload check
        let attachment_url = req.body.attachment_url;
        if (req.file) {
            attachment_url = req.file.filename;
        }

        await pool.execute(
            `UPDATE expenses SET 
                category=?, subcategory=?, amount=?, payment_date=?, payment_method=?, 
                vendor_name=?, description=?, status=?,
                reference_no=?, payer_name=?, payee_name=?, attachment_url=?
             WHERE id=?`,
            [
                category, subcategory, sanitizedAmount, payment_date, payment_method, 
                vendor_name, description, status,
                reference_no, payer_name, payee_name, attachment_url || '',
                id
            ]
        );

        res.status(200).json({ message: 'Expense updated successfully' });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ message: 'Database error' });
    }
};

/**
 * Delete an expense record
 */
export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute(`DELETE FROM expenses WHERE id=?`, [id]);
        res.status(200).json({ message: 'Expense record deleted' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Database error' });
    }
};

/**
 * Get expense statistics for dashboard charts
 */
export const getExpenseStats = async (req, res) => {
    try {
        const { academicYearId } = req.query;
        let whereCondition = "";
        const params = [];

        if (academicYearId) {
            whereCondition = "AND academic_year_id = ?";
            params.push(academicYearId);
        }

        // 1. Total spent this month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [monthlyRes] = await pool.execute(
            `SELECT SUM(amount) as total FROM expenses WHERE payment_date LIKE ? AND status = 'paid' ${whereCondition}`,
            [`${currentMonth}%`, ...params]
        );

        // 2. Total spent this year
        const currentYear = new Date().getFullYear().toString();
        const [yearlyRes] = await pool.execute(
            `SELECT SUM(amount) as total FROM expenses WHERE payment_date LIKE ? AND status = 'paid' ${whereCondition}`,
            [`${currentYear}%`, ...params]
        );

        // 3. Total expenses (All time / By Year)
        const [totalRes] = await pool.execute(
            `SELECT SUM(amount) as total FROM expenses WHERE status = 'paid' ${whereCondition}`,
            params
        );

        // 4. Category breakdown
        const [categoryRes] = await pool.execute(
            `SELECT category, SUM(amount) as total FROM expenses WHERE status = 'paid' ${whereCondition} GROUP BY category`,
            params
        );

        // 5. Status breakdown
        const [statusRes] = await pool.execute(
            `SELECT status, COUNT(*) as count FROM expenses WHERE 1=1 ${whereCondition} GROUP BY status`,
            params
        );

        res.status(200).json({
            monthlyTotal: monthlyRes[0].total || 0,
            yearlyTotal: yearlyRes[0].total || 0,
            totalExpenses: totalRes[0].total || 0,
            categoryBreakdown: categoryRes,
            statusBreakdown: statusRes
        });
    } catch (error) {
        console.error('Error fetching expense stats:', error);
        res.status(500).json({ message: 'Database error' });
    }
};

