import express from 'express';
import multer from 'multer';

import { 
  getAllApplications, 
  getApplicationById, 
  getAdmissionStats, 
  deleteApplication,
  updateApplicationDetails,
  directEnrollStudent
} from '../controllers/admissionController.js';

import upload from '../middleware/multer.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

/**
 *  All routes require authentication
 */
router.use(verifyToken);

/**
 *  File Upload Fields
 */
const uploadFields = upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'birthCert', maxCount: 1 },
  { name: 'leavingCert', maxCount: 1 },
  { name: 'casteCert', maxCount: 1 },
  { name: 'aadharCopy', maxCount: 1 }
]);

/**
 *  Admission Access Control
 * admin, principal → full access
 * accountant → read-only
 */
const admissionAccess = (req, res, next) => {
  const role = req.user.role?.toLowerCase();
  const method = req.method;

  if (role === 'admin' || role === 'principal' || role === 'counsellor') {
    return next();
  }

  if ((role === 'accountant' || role === 'staff' || role === 'hr') && method === 'GET') {
    return next();
  }

  return res.status(403).json({
    message: `Access denied for role: ${role} on ${method}`
  });
};

/**
 * ================= DIRECT ENROLL =================
 *  Only admin & principal
 */
router.post(
  '/direct-enroll',
  admissionAccess,
  (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: "File too large. Maximum size is 10MB."
          });
        }
        return res.status(400).json({
          error: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(500).json({
          error: "Server error during file upload"
        });
      }
      next();
    });
  },
  directEnrollStudent
);

/**
 * ================= APPLICATION ROUTES =================
 */

//  GET : admin, principal, accountant, staff, hr, counsellor
router.get(
  '/all',
  allowRoles('admin', 'principal', 'accountant', 'hr', 'counsellor'),
  getAllApplications
);

router.get(
  '/stats',
  allowRoles('admin', 'principal', 'accountant', 'hr', 'counsellor'),
  getAdmissionStats
);

router.get(
  '/:id',
  allowRoles('admin', 'principal', 'accountant', 'hr', 'counsellor'),
  getApplicationById
);

// WRITE → admin & principal only
router.put(
  '/:id',
  admissionAccess,
  updateApplicationDetails
);

router.delete(
  '/:id',
  admissionAccess,
  deleteApplication
);

export default router;