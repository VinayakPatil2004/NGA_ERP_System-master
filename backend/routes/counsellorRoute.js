import express from 'express';
import { 
    createEnquiry, 
    getAllEnquiries, 
    createFollowup, 
    getFollowupsByEnquiry, 
    createSession, 
    getAllSessions,
    getCounselorStats,
    updateEnquiry,
    getFollowupsDue,
    deleteEnquiry
} from '../controllers/counsellorController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

router.use(verifyToken);
router.use(allowRoles('admin', 'principal', 'counsellor'));

router.get('/stats', getCounselorStats);

router.post('/enquiry', createEnquiry);
router.get('/enquiry/all', getAllEnquiries);
router.put('/enquiry/:id', updateEnquiry);
router.delete('/enquiry/:id', deleteEnquiry);

router.post('/followup', createFollowup);
router.get('/followup/due', getFollowupsDue);
router.get('/followup/:enquiryId', getFollowupsByEnquiry);

router.post('/session', createSession);
router.get('/session/all', getAllSessions);

export default router;
