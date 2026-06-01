import express from 'express';

import { 
    getStudentAttendance, 
    getStaffAttendance, 
    markStudentAttendance, 
    markStaffAttendance,
    getStudentAttendanceByClassroom,
    getAttendanceStats,
    lockStudentAttendance,
    lockStaffAttendance,
    updateAttendanceRecord,
    getStudentAttendanceHistory,
    getStaffAttendanceHistory
} from '../controllers/attendanceController.js';

import {
    getSettings,
    updateSettings
} from '../controllers/attendanceSettingsController.js';

import {
    getCurrentAttendance,
    punchIn,
    punchOut,
    startLunch,
    endLunch,
    startTea,
    endTea,
    getAllowedIp
} from '../controllers/teacherAttendanceController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ================= VIEW STUDENT ATTENDANCE =================

// Admin + Staff
router.get(
    '/students',
    allowRoles('admin', 'principal', 'teacher', 'counsellor'),
    getStudentAttendance
);

// Admin only (sensitive analytics)
router.get(
    '/stats',
    allowRoles('admin', 'principal'),
    getAttendanceStats
);

// Admin + Staff
router.get(
    '/classroom/:classroom_id',
    allowRoles('admin', 'principal', 'teacher', 'counsellor'),
    getStudentAttendanceByClassroom
);

// ================= MARK STUDENT ATTENDANCE =================

// Staff only
router.post(
    '/students',
    allowRoles('admin', 'principal', 'teacher'),
    markStudentAttendance
);

// Admin + Staff/Teacher (locking is critical)
router.post(
    '/students/lock',
    allowRoles('admin', 'principal', 'teacher'),
    lockStudentAttendance
);

// Admin only (editing records)
router.put(
    '/record',
    allowRoles('admin', 'principal'),
    updateAttendanceRecord
);

// ================= STAFF ATTENDANCE =================

// Admin only
router.get(
    '/staff',
    allowRoles('admin', 'principal', 'hr'),
    getStaffAttendance
);

// Admin only
router.post(
    '/staff',
    allowRoles('admin', 'principal', 'hr'),
    markStaffAttendance
);

// Admin only
router.post(
    '/staff/lock',
    allowRoles('admin', 'principal', 'hr'),
    lockStaffAttendance
);

// ================= ATTENDANCE HISTORY =================
router.get(
    '/history/students',
    allowRoles('admin', 'principal', 'teacher', 'counsellor'),
    getStudentAttendanceHistory
);

router.get(
    '/history/staff',
    allowRoles('admin', 'principal', 'hr'),
    getStaffAttendanceHistory
);

// ================= TEACHER SELF-PUNCH =================

const staffPunchRoles = allowRoles('teacher', 'admin', 'principal', 'hr', 'accountant', 'counsellor', 'librarian', 'security_guard', 'bus driver', 'aunty', 'canteen');

//  Teacher / All Staff
router.get('/current', staffPunchRoles, getCurrentAttendance);
router.post('/punch-in', staffPunchRoles, punchIn);
router.post('/punch-out', staffPunchRoles, punchOut);
router.post('/lunch-start', staffPunchRoles, startLunch);
router.post('/lunch-end', staffPunchRoles, endLunch);
router.post('/tea-start', staffPunchRoles, startTea);
router.post('/tea-end', staffPunchRoles, endTea);
router.get('/allowed-ip', staffPunchRoles, getAllowedIp);

// ================= SETTINGS =================
router.get('/settings', allowRoles('admin', 'principal', 'hr'), getSettings);
router.put('/settings', allowRoles('admin', 'principal'), updateSettings);

export default router;