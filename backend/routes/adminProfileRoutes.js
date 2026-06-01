import express from 'express';
import {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword
} from '../controllers/adminProfileController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

// Test Route (optional, keep public or protect if needed)
router.get('/test', (req, res) => res.send('Admin Profile Route Working'));

// Admin Profile Routes
router.get(
  '/',
  verifyToken,
  allowRoles('admin'),
  getAdminProfile
);

router.put(
  '/change-password',
  verifyToken,
  allowRoles('admin'),
  changeAdminPassword
);

router.put(
  '/',
  verifyToken,
  allowRoles('admin'),
  updateAdminProfile
);

export default router;