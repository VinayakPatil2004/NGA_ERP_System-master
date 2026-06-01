import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';
import {
    getPayroll,
    processPayroll,
    updatePayrollStatus,
    getSalaryStructures,
    updateSalaryStructure,
    getLoans,
    createLoan,
    updateLoan,
    deleteLoan,
    getLeaves,
    applyLeave,
    reviewLeave,
    deleteLeave,
    getLeaveStats,
    getStaffPayroll,
    getProfile,
} from '../controllers/hrController.js';

const router = express.Router();

router.use(verifyToken);

const hrAccess = allowRoles('admin', 'principal', 'hr');
const staffAccess = allowRoles('teacher', 'admin', 'principal', 'hr', 'accountant', 'counsellor', 'librarian', 'security_guard', 'bus driver', 'aunty', 'canteen');

// ── Payroll ──────────────────────────────────────────────────────────────────
router.get('/payroll', hrAccess, getPayroll);
router.post('/payroll/process', hrAccess, processPayroll);
router.put('/payroll/:id/status', hrAccess, updatePayrollStatus);
router.get('/payroll/my-records', staffAccess, getStaffPayroll);

// ── Salary Structures ────────────────────────────────────────────────────────
router.get('/salary-structures', hrAccess, getSalaryStructures);
router.post('/salary-structures', hrAccess, updateSalaryStructure);

// ── Loans ───────────────────────────────────────────────────────────────────
router.get('/loans', hrAccess, getLoans);
router.post('/loans', hrAccess, createLoan);
router.put('/loans/:id', hrAccess, updateLoan);
router.delete('/loans/:id', hrAccess, deleteLoan);

// ── Leave Management ─────────────────────────────────────────────────────────
router.get('/leaves', staffAccess, getLeaves);
router.get('/leaves/stats', hrAccess, getLeaveStats);
router.post('/leaves', staffAccess, applyLeave);
router.put('/leaves/:id/action', hrAccess, reviewLeave);
router.delete('/leaves/:id', staffAccess, deleteLeave);
router.get('/profile/:id', hrAccess, getProfile);

export default router;
