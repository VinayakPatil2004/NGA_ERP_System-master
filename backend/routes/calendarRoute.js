import express from 'express';
import {
    getAllCalendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
} from '../controllers/calendarController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

// Allow all authenticated institutional roles to read the calendar
router.get(
    '/all',
    verifyToken,
    allowRoles(
        'admin', 'principal', 'teacher', 'student', 'parent', 
        'librarian', 'accountant', 'hr', 'security_guard', 
        'counsellor'
    ),
    getAllCalendarEvents
);

// Write operations restricted to Admin & Principal
router.post(
    '/add',
    verifyToken,
    allowRoles('admin', 'principal'),
    addCalendarEvent
);

router.put(
    '/update/:id',
    verifyToken,
    allowRoles('admin', 'principal'),
    updateCalendarEvent
);

router.delete(
    '/delete/:id',
    verifyToken,
    allowRoles('admin', 'principal'),
    deleteCalendarEvent
);

export default router;
