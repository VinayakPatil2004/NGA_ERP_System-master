import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { requestLC, getAllLCRequests, getMyLCRequests, teacherApproveLC, principalApproveLC, adminApproveLC, generateLC } from '../controllers/leavingCertificateController.js';

const router = express.Router();

//  Protected
router.use(verifyToken);

//  Request LC
router.get('/', getAllLCRequests);
router.get('/my-requests', getMyLCRequests);
router.post('/request', requestLC);
router.put('/:id/teacher-approve', teacherApproveLC);
router.put('/:id/admin-approve', adminApproveLC);
router.put('/:id/principal-approve', principalApproveLC);
router.get('/:id/generate', generateLC);

export default router;