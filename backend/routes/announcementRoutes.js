import express from 'express';
import { 
    getActiveAnnouncements
} from '../controllers/communicationController.js';

import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken);

// Notice Board (Announcements)
router.get('/active', getActiveAnnouncements);
// Creation and deletion moved exclusively to communicationRoutes.js

export default router;
