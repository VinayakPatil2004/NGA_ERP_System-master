import db from '../config/db.js';

/**
 * Library Controller
 */

// ── Book Management ──────────────────────────────────────────────────────────

export const getBooks = async (req, res) => {
    try {
        const { academic_year_id } = req.query;
        let query = 'SELECT * FROM library_books';
        const params = [];
        if (academic_year_id) {
            query += ' WHERE academic_year_id = ?';
            params.push(academic_year_id);
        }
        query += ' ORDER BY title ASC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching library books:", error);
        res.status(500).json({ error: "Failed to fetch books" });
    }
};

export const addBook = async (req, res) => {
    try {
        const { title, author, isbn, genre, publisher, year, copies, shelf, rack_number, academic_year_id } = req.body;
        console.log("Adding book with data:", req.body);
        const [result] = await db.query(
            `INSERT INTO library_books (title, author, isbn, genre, publisher, year, copies, available, shelf, rack_number, academic_year_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, author, isbn, genre, publisher, year, copies, copies, shelf, rack_number || null, academic_year_id]
        );
        res.json({ message: "Book added successfully", id: result.insertId });
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(500).json({ error: "Failed to add book", details: error.message });
    }
};

export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, isbn, genre, publisher, year, copies, shelf, rack_number, status } = req.body;
        
        // When updating copies, we should adjust availability too
        // Simple logic: if copies increase by 2, available increases by 2
        const [currentRow] = await db.query('SELECT copies, available FROM library_books WHERE id = ?', [id]);
        if (currentRow.length === 0) return res.status(404).json({ error: "Book not found" });
        
        const diff = copies - currentRow[0].copies;
        const newAvailable = Math.max(0, currentRow[0].available + diff);

        await db.query(
            `UPDATE library_books 
             SET title=?, author=?, isbn=?, genre=?, publisher=?, year=?, copies=?, available=?, shelf=?, rack_number=?, status=? 
             WHERE id=?`,
            [title, author, isbn, genre, publisher, year, copies, newAvailable, shelf, rack_number || null, status, id]
        );
        res.json({ message: "Book updated successfully" });
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ error: "Failed to update book" });
    }
};

export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM library_books WHERE id = ?', [id]);
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ error: "Failed to delete book" });
    }
};

// ── Issuance & Returns ───────────────────────────────────────────────────────

export const getTransactions = async (req, res) => {
    try {
        const { academic_year_id } = req.query;
        let query = `
            SELECT i.*, b.title as bookTitle, b.isbn, s.last_name as s_last, s.first_name as s_first, s.middle_name as s_middle
            FROM library_issues i
            JOIN library_books b ON i.book_id = b.id
            LEFT JOIN students s ON i.member_id = s.student_id_no
        `;
        const params = [];
        if (academic_year_id) {
            query += ` WHERE i.academic_year_id = ?`;
            params.push(academic_year_id);
        }
        query += ` ORDER BY i.issue_date DESC, i.id DESC`;
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
};

export const issueBook = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { book_id, member_id, member_name, member_class, issue_date, due_date } = req.body;

        // 1. Check Availability
        const [book] = await connection.query('SELECT available FROM library_books WHERE id = ?', [book_id]);
        if (!book.length || book[0].available <= 0) {
            throw new Error("Book is not available for issue");
        }

        // 2. Create Issue Record
        await connection.query(
            `INSERT INTO library_issues (book_id, member_id, member_name, member_class, issue_date, due_date, status, academic_year_id) 
             VALUES (?, ?, ?, ?, ?, ?, 'Active', ?)`,
            [book_id, member_id, member_name, member_class, issue_date, due_date, req.body.academic_year_id]
        );

        // 3. Update Book Stock
        await connection.query('UPDATE library_books SET available = available - 1 WHERE id = ?', [book_id]);
        if (book[0].available === 1) {
            await connection.query('UPDATE library_books SET status = "Issued" WHERE id = ?', [book_id]);
        }

        await connection.commit();
        res.json({ message: "Book issued successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const returnBook = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params; // Issue ID
        const returnDate = new Date().toISOString().split('T')[0];

        // 1. Get Issue Details
        const [issue] = await connection.query('SELECT * FROM library_issues WHERE id = ?', [id]);
        if (!issue.length) throw new Error("Transaction not found");
        if (issue[0].status === 'Returned') throw new Error("Book already returned");

        // 2. Calculate Fine
        const due = new Date(issue[0].due_date);
        const ret = new Date(returnDate);
        let status = 'Returned';
        if (ret > due) {
            status = 'Returned Late';
            const daysDiff = Math.ceil((ret - due) / (1000 * 60 * 60 * 24));
            const fineAmount = daysDiff * 10; // Default 10 per day
            await connection.query('INSERT INTO library_fines (issue_id, amount, status, academic_year_id) VALUES (?, ?, "Pending", ?)', [id, fineAmount, issue[0].academic_year_id]);
        }

        // 3. Update Issue Record
        await connection.query('UPDATE library_issues SET return_date = ?, status = ? WHERE id = ?', [returnDate, status, id]);

        // 4. Update Book Stock
        await connection.query('UPDATE library_books SET available = available + 1, status = "Available" WHERE id = ?', [issue[0].book_id]);

        await connection.commit();
        res.json({ message: "Book returned successfully", status });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// ── Fines & Notices ──────────────────────────────────────────────────────────

export const getFines = async (req, res) => {
    try {
        const { academic_year_id } = req.query;
        let query = `
            SELECT f.*, i.member_name, i.member_id, b.title as bookTitle, s.last_name as s_last, s.first_name as s_first, s.middle_name as s_middle
            FROM library_fines f
            JOIN library_issues i ON f.issue_id = i.id
            JOIN library_books b ON i.book_id = b.id
            LEFT JOIN students s ON i.member_id = s.student_id_no
        `;
        const params = [];
        if (academic_year_id) {
            query += ` WHERE f.academic_year_id = ?`;
            params.push(academic_year_id);
        }
        query += ` ORDER BY f.status DESC, i.id DESC`;
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch fines" });
    }
};

export const payFine = async (req, res) => {
    try {
        const { id } = req.params;
        const paidDate = new Date().toISOString().split('T')[0];
        await db.query('UPDATE library_fines SET status = "Paid", paid_date = ? WHERE id = ?', [paidDate, id]);
        res.json({ message: "Fine marked as paid" });
    } catch (error) {
        res.status(500).json({ error: "Failed to process payment" });
    }
};

export const getNotices = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM library_notices ORDER BY date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notices" });
    }
};

export const addNotice = async (req, res) => {
    try {
        const { title, content, type, date } = req.body;
        await db.query(
            'INSERT INTO library_notices (title, content, type, date) VALUES (?, ?, ?, ?)',
            [title, content, type, date]
        );
        res.json({ message: "Notice added successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to add notice" });
    }
};

// ── Dashboard Statistics ────────────────────────────────────────────────────────

export const getLibraryStats = async (req, res) => {
    try {
        const { academic_year_id } = req.query;

        // Books total count and available count are independent of academic year, as stock remains same.
        const bookCountQuery = 'SELECT SUM(copies) as totalBooks, SUM(available) as availableBooks FROM library_books';

        let issueCountQuery = 'SELECT COUNT(*) as activeIssues FROM library_issues WHERE status = "Active"';
        let overdueCountQuery = 'SELECT COUNT(*) as overdueIssues FROM library_issues WHERE (status = "Active" OR status = "Overdue") AND due_date < CURDATE()';
        let totalMembersQuery = 'SELECT COUNT(DISTINCT member_id) as totalMembers FROM library_issues';
        let recentIssuesQuery = `
            SELECT i.*, b.title as bookTitle 
            FROM library_issues i 
            JOIN library_books b ON i.book_id = b.id 
        `;

        const issueParams = [];
        const overdueParams = [];
        const memberParams = [];
        const recentParams = [];

        if (academic_year_id) {
            issueCountQuery += ' AND academic_year_id = ?';
            issueParams.push(academic_year_id);

            overdueCountQuery += ' AND academic_year_id = ?';
            overdueParams.push(academic_year_id);

            totalMembersQuery += ' WHERE academic_year_id = ?';
            memberParams.push(academic_year_id);

            recentIssuesQuery += ' WHERE i.academic_year_id = ?';
            recentParams.push(academic_year_id);
        }

        recentIssuesQuery += ' ORDER BY i.issue_date DESC LIMIT 5';

        const [[bookStats]] = await db.query(bookCountQuery);
        const [[issueStats]] = await db.query(issueCountQuery, issueParams);
        const [[overdueStats]] = await db.query(overdueCountQuery, overdueParams);
        const [[memberStats]] = await db.query(totalMembersQuery, memberParams);
        const [recentIssues] = await db.query(recentIssuesQuery, recentParams);

        res.json({
            totalBooks: bookStats.totalBooks || 0,
            availableBooks: bookStats.availableBooks || 0,
            activeIssues: issueStats.activeIssues || 0,
            overdueIssues: overdueStats.overdueIssues || 0,
            totalMembers: memberStats.totalMembers || 0,
            recentIssues: recentIssues
        });
    } catch (error) {
        console.error("Error fetching library stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};
