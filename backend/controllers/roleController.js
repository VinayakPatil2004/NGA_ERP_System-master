import db from '../config/db.js';
import logger from '../utils/logger.js';

// Get all roles
export const getAllRoles = async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM roles ORDER BY role_name ASC');
        res.json(roles);
    } catch (error) {
        logger.error('Error fetching roles:', error.message);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

// Create a new role (future expansion)
export const createRole = async (req, res) => {
    try {
        const { role_name } = req.body;
        if (!role_name) return res.status(400).json({ error: 'Role name is required' });

        const [result] = await db.query('INSERT INTO roles (role_name) VALUES (?)', [role_name]);
        res.status(201).json({ id: result.insertId, role_name });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Role already exists' });
        }
        logger.error('Error creating role:', error.message);
        res.status(500).json({ error: 'Failed to create role' });
    }
};
