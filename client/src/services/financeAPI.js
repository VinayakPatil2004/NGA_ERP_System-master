import API from './API';

/**
 * Finance & Account Management API Service
 */

// ── Fee Structures ─────────────────────────────────────────────────────────

export const getFeeStructures = async () => {
    const response = await API.get('/finance/fee-structures');
    return response.data;
};

export const saveFeeStructure = async (feeData) => {
    const response = await API.post('/finance/fee-structures', feeData);
    return response.data;
};

export const deleteFeeStructure = async (id) => {
    const response = await API.delete(`/finance/fee-structures/${id}`);
    return response.data;
};

// ── Student Fees & Ledger ──────────────────────────────────────────────────

export const getStudentFeeLedger = async (params) => {
    const response = await API.get('/finance/student-fee-ledger', { params });
    return response.data;
};

export const getStudentPaymentDetails = async (params) => {
    const response = await API.get('/finance/student-payment-details', { params });
    return response.data;
};

export const syncInstitutionalLedger = async () => {
    const response = await API.post('/finance/sync-institutional-ledger');
    return response.data;
};

export const recordPayment = async (paymentData) => {
    const response = await API.post('/finance/record-payment', paymentData);
    return response.data;
};

export const recordPaymentEntry = async (entryData) => {
    const response = await API.post('/finance/record-payment-entry', entryData);
    return response.data;
};

// ── Transport Fees ─────────────────────────────────────────────────────────

export const getTransportFees = async () => {
    const response = await API.get('/finance/transport-fees');
    return response.data;
};

export const saveTransportFees = async (transportData) => {
    const response = await API.post('/finance/transport-fees', transportData);
    return response.data;
};

// ── Expenses ───────────────────────────────────────────────────────────────

export const getExpenses = async () => {
    const response = await API.get('/finance/expenses');
    return response.data;
};

export const getExpenseStats = async () => {
    const response = await API.get('/finance/expenses/stats');
    return response.data;
};

export const createExpense = async (formData) => {
    // Note: formData should be used for multipart/form-data (attachments)
    const response = await API.post('/finance/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateExpense = async (id, formData) => {
    const response = await API.put(`/finance/expenses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await API.delete(`/finance/expenses/${id}`);
    return response.data;
};

// ── CA Finance Reports ─────────────────────────────────────────────────────

export const getCAReports = async () => {
    const response = await API.get('/finance/ca-reports');
    return response.data;
};

export const createCAReport = async (formData) => {
    const response = await API.post('/finance/ca-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateCAReport = async (id, formData) => {
    const response = await API.put(`/finance/ca-reports/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteCAReport = async (id) => {
    const response = await API.delete(`/finance/ca-reports/${id}`);
    return response.data;
};

const financeAPI = {
    getFeeStructures,
    saveFeeStructure,
    deleteFeeStructure,
    getStudentFeeLedger,
    getStudentPaymentDetails,
    syncInstitutionalLedger,
    recordPayment,
    recordPaymentEntry,
    getTransportFees,
    saveTransportFees,
    getExpenses,
    getExpenseStats,
    createExpense,
    updateExpense,
    deleteExpense,
    getCAReports,
    createCAReport,
    updateCAReport,
    deleteCAReport
};

export default financeAPI;
