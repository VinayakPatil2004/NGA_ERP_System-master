import express from 'express';

import {
    getAllYears,
    getActiveYear,
    addYear,
    updateYear,
    deleteYear,
    setActiveYear,
    promoteStudents,
    getGlobalStats,
    getDashboardChartsData
} from '../controllers/academicYearController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

//  Public Route (Needed for initial app load & Login context)
router.get(
    '/active',
    getActiveYear
);

//  All other routes require authentication
router.use(verifyToken);

//  Teacher, Principal, Admin, Student, Parent
router.get(
    '/all',
    allowRoles('teacher', 'principal', 'admin', 'student', 'parent', 'accountant', 'counsellor', 'hr', 'librarian', 'security_guard'),
    getAllYears
);


//  Principal + Admin + Accountant 
router.get(
    '/stats',
    allowRoles('principal', 'admin', 'accountant'),
    getGlobalStats
);

router.get(
    '/dashboard-charts',
    allowRoles('principal', 'admin', 'accountant'),
    getDashboardChartsData
);

// ================= WRITE ROUTES =================

//  Admin + Principal
router.post(
    '/add',
    allowRoles('admin', 'principal'),
    addYear
);

router.put(
    '/update/:id',
    allowRoles('admin', 'principal'),
    updateYear
);

router.delete(
    '/delete/:id',
    allowRoles('admin', 'principal'),
    deleteYear
);

router.put(
    '/set-active/:id',
    allowRoles('admin', 'principal'),
    setActiveYear
);

//  Admin + Principal
router.post(
    '/promote',
    allowRoles('admin', 'principal'),
    promoteStudents
);

export default router;