import express from 'express';
import * as timetableController from '../controllers/timetableController.js';

const router = express.Router();

router.get('/settings', timetableController.getSettings);
router.post('/settings', timetableController.updateSettings);

router.get('/rules', timetableController.getSubjectRules);
router.post('/rules', timetableController.upsertSubjectRule);

router.get('/class/:classroom_id', (req, res, next) => {
    req.query.classroom_id = req.params.classroom_id;
    next();
}, timetableController.getClassTimetable);

router.get('/teacher/:teacher_id', (req, res, next) => {
    req.query.teacher_id = req.params.teacher_id;
    next();
}, timetableController.getTeacherTimetable);

router.post('/slot', timetableController.saveTimetableSlot);
router.post('/auto-generate', timetableController.autoGenerateTimetable);
router.delete('/slot/:id', timetableController.deleteTimetableSlot);

export default router;
