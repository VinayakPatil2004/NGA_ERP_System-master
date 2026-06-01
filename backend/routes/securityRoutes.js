import express from 'express';
import { 
    addVisitor, updateVisitor, getAllVisitors, deleteVisitor,
    addGateEntry, updateGateEntry, updateGateExit, getGateLogs,
    requestGatePass, approveGatePass, verifyGatePass,
    addVehicleLog, updateVehicleLog, updateVehicleExit, getVehicleLogs,
    getSecurityOverview, getStaffVisitors, approveVisitor, getStaffAllVisitors, getInstitutionalAllVisitors
} from '../controllers/securityController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

router.use(verifyToken);

// Staff Approval Routes (Any authenticated staff can access their own visitors)
router.get('/visitors/pending', getStaffVisitors);
router.get('/visitors/all-my', getStaffAllVisitors);
router.get('/visitors/all-institutional', getInstitutionalAllVisitors);
router.put('/visitors/:id/approve', approveVisitor);

// Security Role Restricted Routes
const securityRoles = ['security_guard', 'admin', 'principal'];

// Overview
router.get('/overview', allowRoles(...securityRoles), getSecurityOverview);

// Visitors
router.post('/visitors', allowRoles(...securityRoles), addVisitor);
router.put('/visitors/:id', allowRoles(...securityRoles), updateVisitor);
router.delete('/visitors/:id', allowRoles(...securityRoles), deleteVisitor);
router.get('/visitors', allowRoles(...securityRoles), getAllVisitors);

// Gate Entry
router.post('/entries', allowRoles(...securityRoles), addGateEntry);
router.put('/entries/:id', allowRoles(...securityRoles), updateGateEntry);
router.put('/entries/:id/exit', allowRoles(...securityRoles), updateGateExit);
router.get('/entries', allowRoles(...securityRoles), getGateLogs);

// Gate Pass
router.post('/passes', allowRoles(...securityRoles), requestGatePass);
router.put('/passes/:id/approve', allowRoles(...securityRoles), approveGatePass);
router.get('/passes/verify', allowRoles(...securityRoles), verifyGatePass);

// Vehicles
router.post('/vehicles', allowRoles(...securityRoles), addVehicleLog);
router.put('/vehicles/:id', allowRoles(...securityRoles), updateVehicleLog);
router.put('/vehicles/:id/exit', allowRoles(...securityRoles), updateVehicleExit);
router.get('/vehicles', allowRoles(...securityRoles), getVehicleLogs);

export default router;
