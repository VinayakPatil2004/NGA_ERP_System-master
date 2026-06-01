import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';
import {
    importLibraryBooks,
    importStaff,
    importStudents,
    importExamMarks,
    importInventory,
    importVehicles,
    importTransportAssignments,
    importSuppliers,
    importLibraryTransactions,
    bulkUploadStudentDocuments,
    bulkUploadStaffDocuments,
    importFees,
    importSalarySetup,
    importStaffPayroll,
    importLoanAdvance,
    importPayrollRecord
} from '../controllers/bulkImportController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Secure all import routes
router.use(verifyToken);
router.use(allowRoles('admin', 'principal'));

// Library Import
router.post('/library', upload.single('file'), importLibraryBooks);
router.post('/library-transactions', upload.single('file'), importLibraryTransactions);

// Staff Import
router.post('/staff', upload.single('file'), importStaff);

// Student Import
router.post('/students', upload.single('file'), importStudents);

// Exam Marks Import
router.post('/exams', upload.single('file'), importExamMarks);

// Inventory Import
router.post('/inventory', upload.single('file'), importInventory);

// Transport Imports
router.post('/vehicles', upload.single('file'), importVehicles);
router.post('/transport-assignments', upload.single('file'), importTransportAssignments);

// Supplier Import
router.post('/suppliers', upload.single('file'), importSuppliers);

// Fees Import
router.post('/fees', upload.single('file'), importFees);

router.post('/student-documents', upload.array('files', 100), bulkUploadStudentDocuments);
router.post('/staff-documents', upload.array('files', 100), bulkUploadStaffDocuments);

// HR Imports
router.post('/salary-setup', upload.single('file'), importSalarySetup);
router.post('/staff-payroll', upload.single('file'), importStaffPayroll);
router.post('/loan-advance', upload.single('file'), importLoanAdvance);
router.post('/payroll-record', upload.single('file'), importPayrollRecord);

export default router;
