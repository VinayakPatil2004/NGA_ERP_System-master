import express from 'express';
import {
    createExam, updateExam, deleteExam, getExams, updateExamStatus,
    saveExamSettings, getExamSettings,
    saveExamTimetable, getExamTimetable,
    getGradingSystem, saveGradingSystem,
    getPrePrimaryMarks, savePrePrimaryMarks
} from '../controllers/examController.js';

import {
    getMarksBatch, saveMarks, getStudentPerformance, deleteMark,
    saveCoScholastic, getCoScholastic,
    downloadMarksTemplate, bulkUploadMarks
} from '../controllers/marksController.js';
import { generateReportCard } from '../controllers/reportCardController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/temp/' });

const router = express.Router();

router.use(verifyToken);

// --- Admin / Principal Routes ---
router.post('/', allowRoles('admin', 'principal'), createExam);
router.put('/:id', allowRoles('admin', 'principal'), updateExam);
router.delete('/:id', allowRoles('admin', 'principal'), deleteExam);
router.put('/:id/status', allowRoles('admin', 'principal'), updateExamStatus);
router.post('/settings', allowRoles('admin', 'principal'), saveExamSettings);
router.post('/grading', allowRoles('admin', 'principal'), saveGradingSystem);
router.post('/timetable', allowRoles('admin', 'principal'), saveExamTimetable);

// --- Shared / Teacher Routes ---
router.get('/', getExams);
router.get('/settings/:exam_id', getExamSettings);
router.get('/timetable', getExamTimetable);
router.get('/grading', getGradingSystem);

router.get('/marks-batch', allowRoles('admin', 'principal', 'teacher'), getMarksBatch);
router.post('/marks', allowRoles('admin', 'principal', 'teacher'), saveMarks);
router.get('/download-template', allowRoles('admin', 'principal', 'teacher'), downloadMarksTemplate);
router.post('/bulk-upload', allowRoles('admin', 'principal', 'teacher'), upload.single('file'), bulkUploadMarks);

router.post('/co-scholastic', allowRoles('admin', 'principal', 'teacher'), saveCoScholastic);
router.get('/co-scholastic', getCoScholastic);

// --- Student / Result Routes ---
router.get('/performance', getStudentPerformance);
router.delete('/marks/:id', allowRoles('admin', 'principal'), deleteMark);
router.get('/report-card', generateReportCard);

// Pre-Primary
router.get('/pre-primary-marks', getPrePrimaryMarks);
router.post('/pre-primary-marks', allowRoles('admin', 'principal', 'teacher'), savePrePrimaryMarks);

export default router;
