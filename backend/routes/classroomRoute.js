import express from 'express';

import { 
    createClassroom, 
    getClassrooms, 
    updateClassroom, 
    enrollStudent, 
    getEnrolledStudents, 
    assignSubjects, 
    getClassSubjects, 
    promoteStudents,
    deleteClassroom,
    batchCreateClassrooms,
    unenrollStudent,
    batchUpdateRollNumbers,
    updateStudentRollNumber
} from '../controllers/classroomController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

//  All routes require authentication
router.use(verifyToken);

// ================= CLASSROOM MANAGEMENT =================

//  Admin only
router.post(
    '/',
    allowRoles('admin', 'principal'),
    createClassroom
);

router.post(
    '/batch',
    allowRoles('admin', 'principal'),
    batchCreateClassrooms
);

//  Teacher, Principal, Admin, Staff (view)
router.get(
    '/',
    allowRoles('teacher', 'principal', 'admin', 'accountant', 'counsellor', 'security_guard'),
    getClassrooms
);

//  Admin + Principal
router.put(
    '/:id',
    allowRoles('admin', 'principal'),
    updateClassroom
);

// Admin only
router.delete(
    '/:id',
    allowRoles('admin', 'principal'),
    deleteClassroom
);

// ================= ENROLLMENT =================

// Admin + Principal
router.post(
    '/enroll',
    allowRoles('admin', 'principal'),
    enrollStudent
);

router.delete(
    '/enrollment/:enrollment_id',
    allowRoles('admin', 'principal'),
    unenrollStudent
);

// Teacher, Principal, Admin, Staff
router.get(
    '/:classroom_id/students',
    allowRoles('teacher', 'principal', 'admin', 'accountant', 'counsellor'),
    getEnrolledStudents
);

// ================= SUBJECTS =================

// Admin + Principal
router.post(
    '/subjects',
    allowRoles('admin', 'principal'),
    assignSubjects
);

// Teacher, Principal, Admin, Staff
router.get(
    '/:classroom_id/subjects',
    allowRoles('teacher', 'principal', 'admin', 'accountant', 'counsellor'),
    getClassSubjects
);

// ================= PROMOTION =================

// Admin only (critical operation)
router.post(
    '/promote',
    allowRoles('admin', 'principal'),
    promoteStudents
);

// ================= ROLL NUMBERS =================
router.post(
    '/roll-sync',
    allowRoles('admin', 'principal', 'teacher'),
    batchUpdateRollNumbers
);

router.put(
    '/roll-update/:enrollment_id',
    allowRoles('admin', 'principal', 'teacher'),
    updateStudentRollNumber
);

export default router;