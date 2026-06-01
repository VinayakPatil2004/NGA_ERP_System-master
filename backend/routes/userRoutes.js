import express from 'express';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleBlockUser
} from '../controllers/userController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

//  All routes require authentication
router.use(verifyToken);

//  Admin/Principal/Principal/Director only
router.use(allowRoles('admin', 'principal', 'director'));

// ================= PERSONNEL MANAGEMENT =================

//  GET /api/users - Fetch all personnel
router.get('/', getAllUsers);

//  POST /api/users - Create new internal user
router.post('/', createUser);

//  PUT /api/users/:id - Update existing user
router.put('/:id', updateUser);

//  DELETE /api/users/:id - Delete user identity
router.delete('/:id', deleteUser);

//  PATCH /api/users/:id/toggle-block - Suspend/Restore access
router.patch('/:id/toggle-block', toggleBlockUser);

export default router;
