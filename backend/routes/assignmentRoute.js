import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Teacher Routes
router.post('/create', upload.single('file'), assignmentController.createAssignment);
router.put('/:assignment_id', upload.single('file'), assignmentController.updateAssignment);
router.delete('/:assignment_id', assignmentController.deleteAssignment);
router.get('/teacher', assignmentController.getTeacherAssignments);
router.get('/:assignment_id/submissions', assignmentController.getAssignmentSubmissions);
router.put('/submissions/:submission_id/grade', assignmentController.gradeSubmission);
router.delete('/submissions/:submission_id', assignmentController.deleteSubmission);

// Student/Parent Routes
router.get('/classroom/:classroom_id', assignmentController.getClassroomAssignments);
router.post('/submit', upload.single('file'), assignmentController.submitAssignment);

export default router;
