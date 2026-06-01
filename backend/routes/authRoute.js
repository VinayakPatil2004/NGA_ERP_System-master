import express from 'express';
import { login, forgotPassword, resetPassword } from '../controllers/authenticationcontroller.js';
import { getDeviceStatus, bindDevice } from '../controllers/deviceController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs per IP
    message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' }
});

router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

//  Protected routes
router.get('/device-status', verifyToken, getDeviceStatus);
router.post('/bind-device', verifyToken, bindDevice);

export default router;
