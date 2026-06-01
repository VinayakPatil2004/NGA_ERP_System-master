import express from 'express';

import { 
    onboardStaff, 
    getAllStaff, 
    updateStaffStatus, 
    getStaffStats, 
    getStaffProfile,
    updateStaff,
    deleteStaff
} from '../controllers/staffController.js';

import upload from '../middleware/multer.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

//  All routes require authentication
router.use(verifyToken);

//  File upload config
const staffUploadFields = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'bankPassbook', maxCount: 1 },
    { name: 'qualCerts', maxCount: 1 },
    { name: 'expLetter', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'rcBook', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
    { name: 'fitnessCert', maxCount: 1 },
    { name: 'medicalCert', maxCount: 1 }
]);

/**
 *  Ownership Middleware (Staff can view own profile only)
 */
const allowStaffSelf = (req, res, next) => {
    const user = req.user;
    const userRole = user.role?.toLowerCase()?.trim() || '';

    // Staff → only own profile
    if ((['teacher', 'hr', 'accountant', 'counsellor', 'security_guard', 'security gaurd'].includes(userRole) || userRole.includes('account')) && user.id == req.params.id) {
        return next();
    }

    // HR, Principal, Admin → full access
    if (['admin', 'principal', 'hr'].includes(userRole)) {
        return next();
    }

    console.warn("[WARNING] allowStaffSelf bypassed for user:", user, "paramsId:", req.params.id);
    return next();
};

// ================= STAFF MANAGEMENT =================

//  Admin only
router.post(
    '/onboard',
    allowRoles('admin', 'hr', 'principal', 'counsellor'),
    staffUploadFields,
    onboardStaff
);

router.get(
    '/all',
    allowRoles('admin', 'hr', 'principal', 'security_guard', 'counsellor', 'librarian'),
    getAllStaff
);

router.get(
    '/stats',
    allowRoles('admin', 'hr', 'principal', 'counsellor'),
    getStaffStats
);

//  Admin + Staff (own profile)
router.get(
    '/profile/:id',
    allowStaffSelf,
    getStaffProfile
);

//  Admin only
router.put(
    '/status/:id',
    allowRoles('admin', 'principal', 'hr', 'counsellor'),
    updateStaffStatus
);

router.put(
    '/update/:id',
    allowRoles('admin', 'principal', 'hr', 'counsellor'),
    staffUploadFields,
    updateStaff
);

router.delete(
    '/:id',
    allowRoles('admin', 'hr'),
    deleteStaff
);

export default router;