import express from 'express';

import {
    getFeeStructures,
    saveFeeStructure,
    deleteFeeEntry
} from '../controllers/FeesAndFinance/feeStructureController.js';

import {
    getStudentFeeLedger,
    syncInstitutionalFees,
    recordPayment,
    updateStudentPayment,
    createStudentPaymentEntry,
    getStudentPaymentDetails,
    getStudentDueReport,
    getDateWiseCollectionReport         
} from '../controllers/FeesAndFinance/studentFeeController.js';

import {
    getTransportFees,
    saveTransportFees
} from '../controllers/FeesAndFinance/transportFeeController.js';

import {
    createExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
    getExpenseStats
} from '../controllers/FeesAndFinance/expenseController.js';

import {
    getCAReports,
    createCAReport,
    updateCAReport,
    deleteCAReport
} from '../controllers/FeesAndFinance/caFinanceController.js';

import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';
import upload from '../middleware/multer.js';

const router = express.Router();

//  All routes require authentication
router.use(verifyToken);

import { verifyFinanceAccess } from '../middleware/verifyFinanceAccess.js';

// ================= FEE STRUCTURES =================

router.get(
    '/fee-structures',
    allowRoles('admin', 'principal', 'accountant', 'counsellor'),
    getFeeStructures
);

router.post(
    '/fee-structures',
    verifyFinanceAccess,
    saveFeeStructure
);

router.delete(
    '/fee-structures/:id',
    verifyFinanceAccess,
    deleteFeeEntry
);

// ================= STUDENT LEDGER =================

router.get(
    '/student-fee-ledger',
    allowRoles('admin', 'principal', 'accountant'),
    getStudentFeeLedger
);

router.get(
    '/student-payment-details',
    allowRoles('admin', 'principal', 'accountant', 'counsellor'),
    getStudentPaymentDetails
);

router.post(
    '/sync-institutional-ledger',
    verifyFinanceAccess,
    syncInstitutionalFees
);

router.post(
    '/record-payment',
    verifyFinanceAccess,
    upload.single('document'),
    recordPayment
);

// ================= DUE REPORT =================

router.get(
    '/student-due-report',
    allowRoles('admin', 'principal', 'accountant'),
    getStudentDueReport
);

// ================= DATE-WISE COLLECTION =================

router.get(
    '/date-wise-collection-report',
    allowRoles('admin', 'principal', 'accountant'),
    getDateWiseCollectionReport
);

// ================= TRANSPORT FEES =================

router.get(
    '/transport-fees',
    allowRoles('admin', 'principal', 'accountant', 'counsellor'),
    getTransportFees
);

router.post(
    '/transport-fees',
    verifyFinanceAccess,
    saveTransportFees
);

// ================= NEW PAYMENT ENTRY =================

router.post(
    '/record-payment-entry',
    verifyFinanceAccess,
    createStudentPaymentEntry
);

router.put(
    '/update-payment/:id',
    verifyFinanceAccess,
    upload.single('document'),
    updateStudentPayment
);
// ================= EXPENSE MONITORING =================

router.get(
    '/expenses',
    allowRoles('admin', 'principal', 'accountant'),
    getExpenses
);

router.get(
    '/expenses/stats',
    allowRoles('admin', 'principal', 'accountant'),
    getExpenseStats
);

router.post(
    '/expenses',
    verifyFinanceAccess,
    upload.single('attachment'),
    createExpense
);

router.put(
    '/expenses/:id',
    verifyFinanceAccess,
    upload.single('attachment'),
    updateExpense
);

router.delete(
    '/expenses/:id',
    verifyFinanceAccess,
    deleteExpense
);

// ================= CA FINANCE REPORTS =================
router.get(
    '/ca-reports',
    allowRoles('admin', 'principal', 'accountant'),
    getCAReports
);

router.post(
    '/ca-reports',
    verifyFinanceAccess,
    upload.single('attachment'),
    createCAReport
);

router.put(
    '/ca-reports/:id',
    verifyFinanceAccess,
    upload.single('attachment'),
    updateCAReport
);

router.delete(
    '/ca-reports/:id',
    verifyFinanceAccess,
    deleteCAReport
);

export default router;