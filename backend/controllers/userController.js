import db from '../config/db.js';
import bcrypt from 'bcrypt';
import logger from '../utils/logger.js';

// ======================= FETCH PERSONNEL =======================
export const getAllUsers = async (req, res) => {
    try {
        // Fetch all admins with role details
        const [admins] = await db.query(`
            SELECT a.id, a.first_name, a.last_name, CONCAT(a.first_name, ' ', a.last_name) as full_name, a.email, a.username, r.role_name as role_name, a.is_blocked, a.created_at, 'admin' as type
            FROM admins a 
            LEFT JOIN roles r ON a.role_id = r.id
        `);

        // Fetch all staff
        const [staff] = await db.query(`
            SELECT s.id, s.full_name, '' as last_name, s.full_name as full_name, s.email, s.username, r.role_name as role_name, s.is_blocked, s.created_at, 'staff' as type
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
        `);

        // Fetch all students (as users)
        const [students] = await db.query(`
            SELECT s.id, s.first_name, s.last_name, s.middle_name,
            TRIM(CONCAT(s.last_name, ' ', s.first_name, ' ', IFNULL(s.middle_name, ''))) as full_name, 
            '' as email, s.student_id_no as username, s.student_id_no as student_id_no, 
            CASE WHEN s.status = 'alumni' THEN 'ALUMNI' ELSE 'STUDENT' END as role_name, s.is_blocked, s.created_at, 'student' as type
            FROM students s
        `);

        // Fetch all parents
        const [parents] = await db.query(`
            SELECT p.id, p.father_name as first_name, '' as last_name, p.father_name as full_name, p.email, p.father_mobile as username, p.father_mobile as mobile, 
            CASE WHEN s.status = 'alumni' THEN 'ALUMNI PARENT' ELSE 'PARENT' END as role_name, p.is_blocked, p.created_at, 'parent' as type
            FROM parents p
            LEFT JOIN students s ON p.student_id = s.id
        `);

        const allUsers = [...admins, ...staff, ...students, ...parents];
        res.json(allUsers);
    } catch (error) {
        logger.error('Failed to fetch personnel registry:', error);
        res.status(500).json({ error: "Failed to fetch personnel registry" });
    }
};

// ======================= CREATE USER =======================
export const createUser = async (req, res) => {
    const { type, first_name, last_name, email, username, password, role_id } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (type === 'admin') {
            const [result] = await db.query(
                "INSERT INTO admins (first_name, last_name, email, username, password, role_id) VALUES (?, ?, ?, ?, ?, ?)",
                [first_name, last_name, email, username, hashedPassword, role_id]
            );
            res.status(201).json({ id: result.insertId, message: "Admin account established" });
        } else {
            // Staff table uses full_name
            const fullName = `${first_name} ${last_name}`.trim();
            const [result] = await db.query(
                "INSERT INTO staff (full_name, email, username, password, role_id) VALUES (?, ?, ?, ?, ?)",
                [fullName, email, username, hashedPassword, role_id]
            );
            res.status(201).json({ id: result.insertId, message: "Staff account established" });
        }
    } catch (error) {
        logger.error('Failed to create user:', error);
        res.status(500).json({ error: error.message });
    }
};

// ======================= UPDATE USER =======================
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { type, first_name, last_name, email, username, role_id } = req.body;

    try {
        if (type === 'admin') {
            await db.query(
                "UPDATE admins SET first_name = ?, last_name = ?, email = ?, username = ?, role_id = ? WHERE id = ?",
                [first_name, last_name, email, username, role_id, id]
            );
        } else {
            const fullName = `${first_name} ${last_name}`.trim();
            await db.query(
                "UPDATE staff SET full_name = ?, email = ?, username = ?, role_id = ? WHERE id = ?",
                [fullName, email, username, role_id, id]
            );
        }
        res.json({ message: "Identity updated successfully" });
    } catch (error) {
        logger.error('Failed to update user:', error);
        res.status(500).json({ error: error.message });
    }
};

// ======================= TOGGLE BLOCK =======================
export const toggleBlockUser = async (req, res) => {
    const { id } = req.params;
    const { is_blocked, type } = req.body; // Expecting type in body

    try {
        let table;
        if (type === 'admin') table = 'admins';
        else if (type === 'staff') table = 'staff';
        else if (type === 'student') table = 'students';
        else if (type === 'parent') table = 'parents';
        else return res.status(400).json({ error: "Invalid identity type" });

        await db.query(
            `UPDATE ${table} SET is_blocked = ? WHERE id = ?`,
            [is_blocked ? 1 : 0, id]
        );
        res.json({ message: `Access ${is_blocked ? 'suspended' : 'restored'}` });
    } catch (error) {
        logger.error('Access control modification failed:', error);
        res.status(500).json({ error: error.message });
    }
};

// ======================= DELETE USER =======================
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // Expecting type in query

    try {
        let table;
        if (type === 'admin') table = 'admins';
        else if (type === 'staff') table = 'staff';
        else if (type === 'student') table = 'students';
        else if (type === 'parent') table = 'parents';
        else return res.status(400).json({ error: "Invalid identity type" });

        await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        res.json({ message: "Personnel identity Deleted" });
    } catch (error) {
        logger.error('Failed to Delete identity:', error);
        res.status(500).json({ error: error.message });
    }
};
