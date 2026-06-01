import express from 'express';
import { 
    getItems, addItem, updateItem, deleteItem,
    getSuppliers, addSupplier, updateSupplier, deleteSupplier,
    getTransactions, recordTransaction, updateTransaction, deleteTransaction,
    getInventoryStats 
} from '../controllers/inventoryController.js';

import upload from '../middleware/multer.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

router.use(verifyToken);
const inventoryAccess = allowRoles('admin', 'principal', 'accountant');

// Item Catalog
router.get('/items', inventoryAccess, getItems);
router.post('/items', inventoryAccess, upload.single('document'), addItem);
router.put('/items/:id', inventoryAccess, upload.single('document'), updateItem);
router.delete('/items/:id', inventoryAccess, deleteItem);

// Supplier Registry
router.get('/suppliers', inventoryAccess, getSuppliers);
router.post('/suppliers', inventoryAccess, upload.single('identity_proof'), addSupplier);
router.put('/suppliers/:id', inventoryAccess, upload.single('identity_proof'), updateSupplier);
router.delete('/suppliers/:id', inventoryAccess, deleteSupplier);

// Movement Logs & Transactions
router.get('/transactions', inventoryAccess, getTransactions);
router.post('/transactions', inventoryAccess, upload.single('document'), recordTransaction);
router.put('/transactions/:id', inventoryAccess, upload.single('document'), updateTransaction);
router.delete('/transactions/:id', inventoryAccess, deleteTransaction);

// Dashboards & Stats
router.get('/stats', inventoryAccess, getInventoryStats);

export default router;
