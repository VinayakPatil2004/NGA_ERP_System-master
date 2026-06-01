import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Service for Student-Specific Financial Operations.
 * Interacts with the StudentFeeController in the backend.
 */

// 1. Get Student Fee Ledger Summary
export const getStudentFeeLedger = async (academicYearId, grade = '', status = '') => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/finance/student-fee-ledger`, {
            params: { academic_year_id: academicYearId, grade, status },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// 2. Synchronize Institutional Fees
export const syncInstitutionalFees = async (academicYearId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/finance/sync-institutional-ledger`,
            { academic_year_id: academicYearId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// 3. Record a Payment
export const recordStudentPayment = async (payload) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/finance/record-payment`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
