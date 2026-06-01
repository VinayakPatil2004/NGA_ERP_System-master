import express from 'express';

import {
    getAllStudents,
    getStudentById,
    updateStudent,
    getStudentAttendance,
    getStudentExams,
    getStudentFees,
    addStudentFee,
    deleteStudent,
    getAlumni,
    promoteStudents,
    archiveToAlumni,
    getMyStudent,
    getAllStudentLeaves,
    reviewStudentLeave,
    getStudentLeaves,
    applyStudentLeave
} from '../controllers/studentController.js';
import { bulkUploadStudentDocuments } from '../controllers/bulkImportController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * Ownership Check Middleware
 * Allows student to access ONLY their own data
 */
const allowStudentSelf = (req, res, next) => {
    const user = req.user;

    // Admin, staff, teacher, principal, accountant, librarian, counsellor → full access
    const role = user.role?.toLowerCase();
    if (['admin', 'teacher', 'principal', 'accountant', 'librarian', 'counsellor'].includes(role) || user.userType === 'staff') {
        return next();
    }

    // Student → only own data
    if (user.role === 'student' && user.id == req.params.id) {
        return next();
    }

    // Parent → only own child's data
    if (user.role === 'parent' && user.student_id == req.params.id) {
        return next();
    }

    return res.status(403).json({
        message: "Access denied"
    });
};

// ================= GENERAL =================

// Admin + Staff + Teacher
router.get('/all', allowRoles('admin', 'principal', 'accountant', 'counsellor', 'security_guard', 'teacher', 'librarian'), getAllStudents);
// Parent only: fetch linked child details
router.get('/parent/me', allowRoles('parent'), getMyStudent);

router.get('/alumni', allowRoles('admin', 'principal', 'teacher'), getAlumni);

// ================= SINGLE STUDENT =================

//  Admin, Staff, or Student (own data)
router.get('/:id', allowStudentSelf, getStudentById);

//  Admin + Staff
router.put('/:id', allowRoles('admin', 'principal', 'accountant', 'counsellor'), updateStudent);

//  Admin only
router.delete('/:id', allowRoles('admin', 'principal'), deleteStudent);

// ================= PROMOTION =================

//  Admin only
router.post('/promote', allowRoles('admin', 'principal'), promoteStudents);

router.post('/:id/archive', allowRoles('admin', 'principal', 'counsellor'), archiveToAlumni);

//  Admin only
router.post('/bulk-documents', allowRoles('admin', 'principal', 'counsellor'), upload.array('files'), bulkUploadStudentDocuments);

// ================= STUDENT DATA =================

//  Admin, Staff, or Student (own)
router.get('/:id/attendance', allowStudentSelf, getStudentAttendance);

router.get('/:id/exams', allowStudentSelf, getStudentExams);

router.get('/:id/fees', allowStudentSelf, getStudentFees);

// Admin + Staff only
router.post('/:id/fees', allowRoles('admin', 'principal', 'accountant'), addStudentFee);

// ================= LEAVES =================

// Admin, Staff, Teacher, Principal
router.get('/all/leaves', allowRoles('admin', 'teacher', 'principal'), getAllStudentLeaves);

// Teacher can review their own class or Admin/Staff
router.put('/leaves/:leaveId/review', allowRoles('admin', 'teacher', 'principal'), reviewStudentLeave);

// Get specific student leaves
router.get('/:id/leaves', allowStudentSelf, getStudentLeaves);
router.post('/:id/leaves', allowStudentSelf, applyStudentLeave);

export default router;