import express from 'express';
import * as parentController from '../controllers/parentController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken);

router.get('/child-details', parentController.getParentChildDetails);

export default router;
