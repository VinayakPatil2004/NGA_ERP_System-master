import express from 'express';

import {
  getAllRoles,
  createRole
} from '../controllers/roleController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

//  All routes require authentication
router.use(verifyToken);

//  Admin, Principal, HR, Counsellor allowed
router.use(allowRoles('admin', 'principal', 'hr', 'counsellor'));

// ================= ROLE MANAGEMENT =================

// Admin only
router.get('/', getAllRoles);

// Admin only
router.post('/', createRole);

export default router;