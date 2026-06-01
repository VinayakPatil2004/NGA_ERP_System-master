import db from '../config/db.js';
import bcrypt from 'bcrypt';

// Get Admin Profile / Staff Profile
export const getAdminProfile = async (req, res) => {
    try {
        const userId = req.user.id; // This is staff.id for staff/principal, and adminId for admin
        const isStaff = req.user.userType === 'staff' || req.user.role?.toLowerCase() === 'principal';

        if (isStaff) {
            const [staffRows] = await db.query(`
                SELECT s.*, u.password_changed_at 
                FROM staff s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = ?
            `, [userId]);

            if (staffRows.length === 0) {
                return res.status(204).json({}); // Return empty if not created yet
            }

            const s = staffRows[0];
            const nameParts = s.full_name ? s.full_name.trim().split(/\s+/) : ['', ''];
            const first_name = nameParts[0] || '';
            const last_name = nameParts.slice(1).join(' ') || '';

            return res.status(200).json({
                first_name,
                last_name,
                email: s.email,
                mobile_number: s.mobile,
                address: s.address,
                password_changed_at: s.password_changed_at
            });
        }

        // Default admin behavior
        const [admins] = await db.query(`SELECT * FROM admins WHERE id = ?`, [userId]);
        
        if (admins.length === 0) {
            return res.status(404).json({ error: "Institutional administrator record not found" });
        }
        
        res.status(200).json(admins[0]);
    } catch (err) {
        console.error('Error fetching admin profile:', err);
        res.status(500).json({ error: 'Institutional service error' });
    }
};

// Update Admin Profile / Staff Profile
export const updateAdminProfile = async (req, res) => {
    try {
        const userId = req.user.id; // This is staff.id for staff/principal, and adminId for admin
        const { first_name, last_name, email, mobile_number, address } = req.body;
        const isStaff = req.user.userType === 'staff' || req.user.role?.toLowerCase() === 'principal';

        if (isStaff) {
            const fullName = `${first_name || ''} ${last_name || ''}`.trim();
            await db.query(
                'UPDATE staff SET full_name = ?, email = ?, mobile = ?, address = ? WHERE id = ?',
                [fullName, email, mobile_number, address, userId]
            );
            return res.status(200).json({ message: "Institutional profile updated successfully" });
        }

        await db.query(
            'UPDATE admins SET first_name = ?, last_name = ?, email = ?, mobile_number = ?, address = ? WHERE id = ?',
            [first_name, last_name, email, mobile_number, address, userId]
        );

        res.status(200).json({ message: "Institutional profile updated successfully" });
    } catch (err) {
        console.error('Error updating admin profile:', err);
        res.status(500).json({ error: 'Institutional service error' });
    }
};

// Change Admin Password / Staff Password
export const changeAdminPassword = async (req, res) => {
    try {
        const userId = req.user.id; // This is staff.id for staff/principal, and adminId for admin
        const { current_password, new_password } = req.body;
        const isStaff = req.user.userType === 'staff' || req.user.role?.toLowerCase() === 'principal';

        if (isStaff) {
            // Retrieve the users.id associated with this staff member
            const [staffRows] = await db.query('SELECT user_id FROM staff WHERE id = ?', [userId]);
            if (staffRows.length === 0) return res.status(404).json({ error: "Staff record not found" });
            const realUserId = staffRows[0].user_id;

            const [users] = await db.query('SELECT password FROM users WHERE id = ?', [realUserId]);
            if (users.length === 0) return res.status(404).json({ error: "Institutional account not found" });

            const isMatch = await bcrypt.compare(current_password, users[0].password);
            if (!isMatch) return res.status(400).json({ error: "Incorrect current credentials" });

            const hashedNewPassword = await bcrypt.hash(new_password, 10);

            await db.query(
                'UPDATE users SET password = ?, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedNewPassword, realUserId]
            );
        } else {
            const [admins] = await db.query('SELECT password FROM admins WHERE id = ?', [userId]);
            if (admins.length === 0) return res.status(404).json({ error: "Institutional account not found" });

            const isMatch = await bcrypt.compare(current_password, admins[0].password);
            if (!isMatch) return res.status(400).json({ error: "Incorrect current credentials" });

            const hashedNewPassword = await bcrypt.hash(new_password, 10);

            await db.query(
                'UPDATE admins SET password = ?, password_changed_at = CURRENT_TIMESTAMP, old_password = ?, c_password = ?, change_password_date = NOW() WHERE id = ?',
                [hashedNewPassword, current_password, new_password, userId]
            );
        }

        res.status(200).json({ message: "Institutional credentials updated successfully" });
    } catch (err) {
        console.error('Error changing admin password:', err);
        res.status(500).json({ error: 'Institutional service error' });
    }
};
