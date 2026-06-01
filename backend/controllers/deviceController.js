import pool from '../config/db.js';

export const getDeviceStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const table = req.user.userType === 'staff' ? 'staff' : (req.user.userType === 'admin' ? 'admins' : 'users');
        const [rows] = await pool.query(`SELECT device_id, device_bound_at FROM ${table} WHERE id = ?`, [userId]);
        const user = rows[0];
        return res.json({
            deviceBound: !!user?.device_id,
            deviceBoundAt: user?.device_bound_at,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const bindDevice = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceId } = req.body;
        if (!deviceId) return res.status(400).json({ message: 'Device ID required' });

        const table = req.user.userType === 'staff' ? 'staff' : (req.user.userType === 'admin' ? 'admins' : 'users');
        await pool.query(`UPDATE ${table} SET device_id = ?, device_bound_at = NOW() WHERE id = ?`, [
            deviceId,
            userId,
        ]);

        return res.json({ success: true, message: 'Device bound successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
