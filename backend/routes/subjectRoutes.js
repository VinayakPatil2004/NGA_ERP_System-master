import express from 'express';
import { getSubjects, addSubject } from '../controllers/subjectController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', verifyToken, getSubjects);
router.post('/', verifyToken, addSubject);

export default router;

