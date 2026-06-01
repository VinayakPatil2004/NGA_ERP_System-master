import express from 'express';
import {
    getBooks, addBook, updateBook, deleteBook,
    getTransactions, issueBook, returnBook,
    getFines, payFine,
    getNotices, addNotice,
    getLibraryStats
} from '../controllers/libraryController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/allowRoles.js';

const router = express.Router();

router.use(verifyToken);

// General
router.get('/stats', allowRoles('admin', 'principal', 'librarian'), getLibraryStats);

// Books
router.get('/books', allowRoles('admin', 'principal', 'librarian', 'teacher', 'student'), getBooks);
router.post('/books', allowRoles('admin', 'principal', 'librarian'), addBook);
router.put('/books/:id', allowRoles('admin', 'principal', 'librarian'), updateBook);
router.delete('/books/:id', allowRoles('admin', 'principal', 'librarian'), deleteBook);

// Transactions
router.get('/transactions', allowRoles('admin', 'principal', 'librarian', 'teacher', 'student'), getTransactions);
router.post('/issue', allowRoles('admin', 'principal', 'librarian'), issueBook);
router.put('/return/:id', allowRoles('admin', 'principal', 'librarian'), returnBook);

// Fines
router.get('/fines', allowRoles('admin', 'principal', 'librarian'), getFines);
router.put('/fines/:id/pay', allowRoles('admin', 'principal', 'librarian', 'accountant'), payFine);

// Notices
router.get('/notices', allowRoles('admin', 'principal', 'librarian', 'teacher', 'student'), getNotices);
router.post('/notices', allowRoles('admin', 'principal', 'librarian'), addNotice);

export default router;
