import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';
import { 
    requestCertificate, getAllCertificateRequests, getMyCertificateRequests,
    teacherApproveCertificate, adminApproveCertificate, principalApproveCertificate,
    submitCertificateGrievance, generateBonafideCertificate,
    deleteCertificateRequest, updateCertificateRequest, adminUpdateCertificate
} from '../controllers/certificateController.js';

const router = express.Router();

//  Protected route
router.use(verifyToken);

//  Student Request
router.get('/', allowRoles('admin', 'principal', 'teacher'), getAllCertificateRequests);
router.get('/my-requests', getMyCertificateRequests); // student/parent accessible
router.post('/request', requestCertificate); // student/parent accessible
router.put('/:id', updateCertificateRequest); // student/parent accessible
router.delete('/:id', deleteCertificateRequest); // student/parent accessible
router.put('/:id/teacher-approve', allowRoles('teacher', 'admin', 'principal'), teacherApproveCertificate);
router.put('/:id/admin-approve', allowRoles('admin', 'principal'), adminApproveCertificate);
router.put('/:id/principal-approve', allowRoles('principal', 'admin'), principalApproveCertificate);
router.post('/:id/grievance', submitCertificateGrievance);
router.put('/:id/admin-update', allowRoles('admin', 'principal'), adminUpdateCertificate);
router.get('/:id/generate', allowRoles('admin', 'principal'), generateBonafideCertificate);

export default router;