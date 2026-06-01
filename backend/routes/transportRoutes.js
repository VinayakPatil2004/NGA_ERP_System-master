import express from 'express';
import { 
    getVehicles, addVehicle, updateVehicle, deleteVehicle,
    getAssignments, assignStudent, removeAssignment, updateAssignment 
} from '../controllers/transportController.js';

const router = express.Router();

// Vehicle Registry
router.get('/vehicles', getVehicles);
router.post('/vehicles', addVehicle);
router.put('/vehicles/:id', updateVehicle);
router.delete('/vehicles/:id', deleteVehicle);

// Student Assignment
router.get('/assignments', getAssignments);
router.post('/assignments', assignStudent);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', removeAssignment);

export default router;
