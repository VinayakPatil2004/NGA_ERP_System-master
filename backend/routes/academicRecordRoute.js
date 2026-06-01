import express from 'express';

import {
  getAcademicRecordsByClassroom,
  getAcademicRecordByStudent
} from '../controllers/academicRecordController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * Ownership Middleware
 * Student can access ONLY their own records
 */
const allowStudentSelf = (req, res, next) => {
  const user = req.user;

  // Admin, Principal, Teacher, Staff, Accountant, Counsellor → full access
  const role = user.role?.toLowerCase();
  if (['admin', 'principal', 'teacher', 'accountant', 'counsellor'].includes(role)) {
    return next();
  }

  // Student → only own record
  if (user.role === 'student' && user.id == req.params.student_id) {
    return next();
  }

  return res.status(403).json({
    message: "Access denied"
  });
};

// ================= CLASSROOM RECORDS =================

// Teacher, Principal, Admin, Staff, Accountant
router.get(
  '/classroom/:classroom_id',
  allowRoles('teacher', 'principal', 'admin', 'accountant'),
  getAcademicRecordsByClassroom
);

// ================= STUDENT RECORD =================

//  Teacher, Principal, Admin + Student (own)
router.get(
  '/student/:student_id',
  allowStudentSelf,
  getAcademicRecordByStudent
);

export default router;