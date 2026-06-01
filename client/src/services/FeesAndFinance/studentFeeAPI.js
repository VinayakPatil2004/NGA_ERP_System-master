import API from '../API';

/**
 * Institutional Student Fee Management API Service
 */

// ── 1. Get Student Fee Ledger (SPECIFIC YEAR) ──
export const getStudentFeeLedger = async (academicYearId, grade = '', status = '') => {
    const response = await API.get('/finance/student-fee-ledger', {
        params: { academicYearId, grade, status }
    });
    return response.data;
};

// ── 1.5 Get Single Student Fee Summary ──
export const getStudentFeeSummary = async (studentId, academicYearId) => {
    const response = await API.get(`/students/${studentId}/fee-summary`, {
        params: { academicYearId }
    });
    return response.data;
};

// ── 2. Synchronize Institutional Fees ──
export const syncInstitutionalFees = async (academicYearId) => {
    const response = await API.post('/finance/sync-institutional-ledger', { 
        academic_year_id: academicYearId 
    });
    return response.data;
};

// ── 3. Record a Student Payment ──
export const recordStudentPayment = async (payload) => {
    const response = await API.post('/finance/record-payment', payload);
    return response.data;
};


// ── 4. Update a Student Payment ──
export const updateStudentPayment = async (id, payload) => {
    const response = await API.put(`/finance/update-payment/${id}`, payload);
    return response.data;
};


const studentFeeAPI = {
    getStudentFeeLedger,
    getStudentFeeSummary,
    syncInstitutionalFees,
    recordPayment: recordStudentPayment,
    updateStudentPayment
};

export default studentFeeAPI;