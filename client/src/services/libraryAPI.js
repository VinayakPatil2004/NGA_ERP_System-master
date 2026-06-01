import API from './API';

/**
 * Library Management API Service
 */

// ── Books ──────────────────────────────────────────────────────────────────

export const getAllBooks = async (academicYearId) => {
    const response = await API.get('/library/books', {
        params: { academic_year_id: academicYearId }
    });
    return response.data;
};

export const addBook = async (bookData) => {
    const response = await API.post('/library/books', bookData);
    return response.data;
};

export const updateBook = async (id, bookData) => {
    const response = await API.put(`/library/books/${id}`, bookData);
    return response.data;
};

export const deleteBook = async (id) => {
    const response = await API.delete(`/library/books/${id}`);
    return response.data;
};

// ── Transactions ───────────────────────────────────────────────────────────

export const getTransactions = async (academicYearId) => {
    const response = await API.get('/library/transactions', {
        params: { academic_year_id: academicYearId }
    });
    return response.data;
};

export const issueBook = async (issueData) => {
    const response = await API.post('/library/issue', issueData);
    return response.data;
};

export const returnBook = async (id) => {
    const response = await API.put(`/library/return/${id}`);
    return response.data;
};

// ── Fines ──────────────────────────────────────────────────────────────────

export const getFines = async (academicYearId) => {
    const response = await API.get('/library/fines', {
        params: { academic_year_id: academicYearId }
    });
    return response.data;
};

export const payFine = async (id) => {
    const response = await API.put(`/library/fines/${id}/pay`);
    return response.data;
};

// ── Notices ────────────────────────────────────────────────────────────────

export const getNotices = async () => {
    const response = await API.get('/library/notices');
    return response.data;
};

export const addNotice = async (noticeData) => {
    const response = await API.post('/library/notices', noticeData);
    return response.data;
};

// ── Statistics ─────────────────────────────────────────────────────────────

export const getStats = async (academicYearId) => {
    const response = await API.get('/library/stats', {
        params: { academic_year_id: academicYearId }
    });
    return response.data;
};

export const importBooks = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/library', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const importTransactions = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/library-transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

const libraryAPI = {
    getAllBooks,
    addBook,
    updateBook,
    deleteBook,
    getTransactions,
    issueBook,
    returnBook,
    getFines,
    payFine,
    getNotices,
    addNotice,
    getStats,
    importBooks,
    importTransactions
};

export default libraryAPI;
