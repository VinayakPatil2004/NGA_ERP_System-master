import pool from '../config/db.js';
import { calculateDistance } from '../utils/haversine.js';
import { getISTDateStr } from '../utils/dateUtils.js';

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
    }
    return req.socket?.remoteAddress ?? req.ip ?? '';
}

function normalizeIp(ip) {
    if (ip.startsWith('::ffff:')) return ip.slice(7);
    return ip;
}

function getDeviceType(req) {
    const ua = req.headers['user-agent'] || '';
    if (req.headers['x-device-id']) return 'mobile'; // App always sends this
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'laptop';
}

function getMinutesSinceMidnight(d) {
    // Note: This uses system time. Ensure server is set to IST or adjust here.
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);
    return istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
}

function isWithinWindow(now, startStr, endStr) {
    if (!startStr || !endStr) return true; // Allow if no window set
    const m = getMinutesSinceMidnight(now);
    const [sH, sM] = startStr.split(':').map(Number);
    const [eH, eM] = endStr.split(':').map(Number);
    return m >= sH * 60 + sM && m <= eH * 60 + eM;
}

export const getAllowedIp = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT allowed_ip FROM settings LIMIT 1');
        const allowedIp = rows[0]?.allowed_ip?.trim() ?? null;
        return res.json({ allowedIp });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getCurrentAttendance = async (req, res) => {
    try {
        const userId = req.user.id;
        const dateStr = getISTDateStr();

        const [rows] = await pool.query('SELECT * FROM attendances WHERE user_id = ? AND user_type = ? AND date = ?', [
            userId,
            req.user.userType,
            dateStr,
        ]);
        const att = rows[0];
        if (!att) {
            return res.json({ punchInTime: null, punchOutTime: null, status: 'out' });
        }
        const status = att.punch_out_time ? 'complete' : att.punch_in_time ? 'in' : 'out';
        return res.json({
            punchInTime: att.punch_in_time,
            punchOutTime: att.punch_out_time,
            punchInLocation:
                att.punch_in_lat != null ? { latitude: att.punch_in_lat, longitude: att.punch_in_lng } : undefined,
            punchOutLocation:
                att.punch_out_lat != null ? { latitude: att.punch_out_lat, longitude: att.punch_out_lng } : undefined,
            lunchStartTime: att.lunch_start_time,
            lunchEndTime: att.lunch_end_time,
            teaStartTime: att.tea_start_time,
            teaEndTime: att.tea_end_time,
            status,
            isLate: !!att.is_late,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const punchIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const { location, via } = req.body;
        const now = new Date();
        const dateStr = getISTDateStr(now);

        const [setRows] = await pool.query('SELECT * FROM settings LIMIT 1');
        const settings = setRows[0];

        if (settings && !isWithinWindow(now, settings.punch_in_start, settings.punch_in_end)) {
            return res.status(403).json({
                message: `Punch In is only allowed between ${settings.punch_in_start?.slice(0, 5) || 'N/A'} and ${settings.punch_in_end?.slice(0, 5) || 'N/A'}.`,
            });
        }

        // Late mark logic: After 10:20 AM (IST)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset);
        const currentMinutes = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
        const lateThreshold = 10 * 60 + 20; // 10:20 AM
        const isLate = currentMinutes > lateThreshold;
        const lateMinutes = isLate ? (currentMinutes - lateThreshold) : 0;

        const [userRows] = await pool.query(
            `SELECT device_id FROM ${req.user.userType === 'staff' ? 'staff' : (req.user.userType === 'admin' ? 'admins' : 'users')} WHERE id = ?`, 
            [userId]
        );
        const user = userRows[0];
        
        const clientDeviceId = req.headers['x-device-id'];
        if (user?.device_id && user.device_id !== clientDeviceId) {
            return res.status(403).json({ message: 'Device not authorized. Please contact admin.' });
        }

        const [existingRows] = await pool.query(
            'SELECT * FROM attendances WHERE user_id = ? AND user_type = ? AND date = ?',
            [userId, req.user.userType, dateStr]
        );
        if (existingRows[0]?.punch_in_time) {
            return res.status(400).json({ message: 'Already punched in today' });
        }

        if (via === 'wifi') {
            if (settings?.allowed_ip) {
                const clientIp = normalizeIp(getClientIp(req));
                const allowedIp = normalizeIp(settings.allowed_ip);
                console.log(`[WiFi Check] Client: ${clientIp}, Allowed: ${allowedIp}`);
                
                if (clientIp !== allowedIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
                    return res.status(403).json({ message: 'Not connected to office WiFi.' });
                }
            }
            
            if (existingRows[0]) {
                await pool.query(
                    'UPDATE attendances SET punch_in_time = ?, punch_in_method = ?, is_late = ?, late_minutes = ? WHERE id = ?',
                    [now, 'wifi', isLate, lateMinutes, existingRows[0].id]
                );
            } else {
                const deviceType = getDeviceType(req);
                await pool.query(
                    'INSERT INTO attendances (user_id, user_type, device_type, date, punch_in_time, punch_in_method, is_late, late_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, req.user.userType, deviceType, dateStr, now, 'wifi', isLate, lateMinutes]
                );
            }
        } else {
            if (!location) return res.status(400).json({ message: 'Location data required for GPS punch' });
            
            if (settings) {
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    settings.office_latitude,
                    settings.office_longitude
                );
                if (distance > settings.office_radius) {
                    return res.status(400).json({
                        message: `You are ${Math.round(distance)}m away from office. Max allowed is ${settings.office_radius}m`,
                    });
                }
            }

            if (existingRows[0]) {
                await pool.query(
                    'UPDATE attendances SET punch_in_time = ?, punch_in_lat = ?, punch_in_lng = ?, punch_in_method = ?, is_late = ?, late_minutes = ? WHERE id = ?',
                    [now, location.latitude, location.longitude, 'gps', isLate, lateMinutes, existingRows[0].id]
                );
            } else {
                const deviceType = getDeviceType(req);
                await pool.query(
                    'INSERT INTO attendances (user_id, user_type, device_type, date, punch_in_time, punch_in_lat, punch_in_lng, punch_in_method, is_late, late_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, req.user.userType, deviceType, dateStr, now, location.latitude, location.longitude, 'gps', isLate, lateMinutes]
                );
            }
        }

        // Sync with official staff_attendance registry
        if (req.user.userType === 'staff') {
            try {
                const [[activeYear]] = await pool.query("SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1");
                const timeStr = now.toTimeString().slice(0, 8);
                await pool.query(
                    `INSERT INTO staff_attendance (staff_id, status, date, check_in_time, academic_year_id)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        status = 'present',
                        check_in_time = IFNULL(check_in_time, VALUES(check_in_time)),
                        academic_year_id = VALUES(academic_year_id)`,
                    [userId, 'present', dateStr, timeStr, activeYear?.id || null]
                );
            } catch (syncErr) {
                console.error('[Sync Error] Failed to update staff_attendance:', syncErr);
            }
        }

        return res.json({ success: true, message: 'Punched in successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const punchOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const { location, via } = req.body;
        const now = new Date();
        const dateStr = getISTDateStr(now);

        const [setRows] = await pool.query('SELECT * FROM settings LIMIT 1');
        const settings = setRows[0];

        if (settings && !isWithinWindow(now, settings.punch_out_start, settings.punch_out_end)) {
            return res.status(403).json({
                message: `Punch Out is only allowed between ${settings.punch_out_start?.slice(0, 5) || 'N/A'} and ${settings.punch_out_end?.slice(0, 5) || 'N/A'}.`,
            });
        }

        const [attRows] = await pool.query(
            'SELECT * FROM attendances WHERE user_id = ? AND user_type = ? AND date = ?',
            [userId, req.user.userType, dateStr]
        );
        const attendance = attRows[0];
        if (!attendance?.punch_in_time) {
            return res.status(400).json({ message: 'You are not punched in today' });
        }
        if (attendance.punch_out_time) {
            return res.status(400).json({ message: 'Already punched out today' });
        }

        if (via === 'wifi') {
            if (settings?.allowed_ip) {
                const clientIp = normalizeIp(getClientIp(req));
                const allowedIp = normalizeIp(settings.allowed_ip);
                console.log(`[WiFi Check OUT] Client: ${clientIp}, Allowed: ${allowedIp}`);
                
                if (clientIp !== allowedIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
                    return res.status(403).json({ message: 'Not connected to office WiFi.' });
                }
            }
            await pool.query(
                'UPDATE attendances SET punch_out_time = ?, punch_out_method = ? WHERE id = ?',
                [now, 'wifi', attendance.id]
            );
        } else {
            if (!location) return res.status(400).json({ message: 'Location data required for GPS punch' });
            if (settings) {
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    settings.office_latitude,
                    settings.office_longitude
                );
                if (distance > settings.office_radius) {
                    return res.status(400).json({
                        message: `You are ${Math.round(distance)}m away from office. Max allowed is ${settings.office_radius}m`,
                    });
                }
            }
            await pool.query(
                'UPDATE attendances SET punch_out_time = ?, punch_out_lat = ?, punch_out_lng = ?, punch_out_method = ? WHERE id = ?',
                [now, location.latitude, location.longitude, 'gps', attendance.id]
            );
        }

        // Sync with official staff_attendance registry
        if (req.user.userType === 'staff') {
            try {
                const timeStr = now.toTimeString().slice(0, 8);
                await pool.query(
                    `UPDATE staff_attendance 
                     SET check_out_time = ?, status = 'present'
                     WHERE staff_id = ? AND date = ?`,
                    [timeStr, userId, dateStr]
                );
            } catch (syncErr) {
                console.error('[Sync Error] Failed to update staff_attendance (OUT):', syncErr);
            }
        }

        return res.json({ success: true, message: 'Punched out successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const startLunch = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const dateStr = getISTDateStr(now);
        const [rows] = await pool.query('SELECT * FROM attendances WHERE user_id = ? AND user_type = ? AND date = ?', [userId, req.user.userType, dateStr]);
        const att = rows[0];
        if (!att || !att.punch_in_time) return res.status(400).json({ message: 'Must punch in first' });
        if (att.lunch_start_time) return res.status(400).json({ message: 'Lunch already started' });
        await pool.query('UPDATE attendances SET lunch_start_time = ? WHERE id = ?', [now, att.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const endLunch = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const dateStr = getISTDateStr(now);
        const [rows] = await pool.query('SELECT * FROM attendances WHERE user_id = ? AND user_type = ? AND date = ?', [userId, req.user.userType, dateStr]);
        const att = rows[0];
        if (!att || !att.lunch_start_time) return res.status(400).json({ message: 'Lunch not started' });
        if (att.lunch_end_time) return res.status(400).json({ message: 'Lunch already ended' });
        await pool.query('UPDATE attendances SET lunch_end_time = ? WHERE id = ?', [now, att.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const startTea = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const dateStr = getISTDateStr(now);
        const [rows] = await pool.query('SELECT * FROM attendances WHERE user_id = ? AND user_type = ? AND date = ?', [userId, req.user.userType, dateStr]);
        const att = rows[0];
        if (!att || !att.punch_in_time) return res.status(400).json({ message: 'Must punch in first' });
        if (att.tea_start_time) return res.status(400).json({ message: 'Tea break already started' });
        await pool.query('UPDATE attendances SET tea_start_time = ? WHERE id = ?', [now, att.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const endTea = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const dateStr = getISTDateStr(now);
        const [rows] = await pool.query('SELECT * FROM attendances WHERE user_id = ? AND user_type = ? AND date = ?', [userId, req.user.userType, dateStr]);
        const att = rows[0];
        if (!att || !att.tea_start_time) return res.status(400).json({ message: 'Tea break not started' });
        if (att.tea_end_time) return res.status(400).json({ message: 'Tea break already ended' });
        await pool.query('UPDATE attendances SET tea_end_time = ? WHERE id = ?', [now, att.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
