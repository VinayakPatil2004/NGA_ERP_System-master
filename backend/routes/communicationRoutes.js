import express from 'express';
import { 
    sendMessage, getInbox, getOutbox, 
    createAnnouncement, getActiveAnnouncements, deleteAnnouncement, updateAnnouncement,
    markAsRead, sendEmailBroadcast, sendSMSBroadcast,
    uploadCircular, getCirculars, deleteCircular
} from '../controllers/communicationController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.use(verifyToken);

// Messaging Registry
router.post('/send', sendMessage);
router.get('/inbox', getInbox);
router.get('/outbox', getOutbox);
router.put('/mark-read/:id', markAsRead);

// Notice Board (Announcements)
router.get('/announcements', getActiveAnnouncements);
router.post('/announcements', allowRoles('admin', 'principal', 'teacher'), upload.single('attachment'), createAnnouncement);
router.put('/announcements/:id', allowRoles('admin', 'principal', 'teacher'), upload.single('attachment'), updateAnnouncement);
router.delete('/announcements/:id', allowRoles('admin', 'principal', 'teacher'), deleteAnnouncement);

// Email & SMS Broadcasts
router.post('/email', allowRoles('admin', 'principal'), sendEmailBroadcast);
router.post('/sms', allowRoles('admin', 'principal'), sendSMSBroadcast);

// Circulars (PDFs)
router.get('/circulars', getCirculars);
router.post('/circulars', allowRoles('admin', 'principal', 'teacher'), upload.single('document'), uploadCircular);
router.delete('/circulars/:id', allowRoles('admin', 'principal', 'teacher'), deleteCircular);

export default router;
