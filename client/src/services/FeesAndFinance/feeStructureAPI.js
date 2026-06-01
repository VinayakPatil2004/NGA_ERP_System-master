import API from '../API';

/**
 * Institutional Fee Structure API Service.
 * Provides secure communication for managing grade-wise and term-based fee definitions.
 */

// 1. Fetch fee structures for a specific grade and academic year
export const getFeeStructures = async (academicYearId, grade) => {
    try {
        const response = await API.get('/finance/fee-structures', {
            params: { academic_year_id: academicYearId, grade }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching institutional fee structures:", error);
        throw error.response?.data || error.message;
    }
};

// 2. Save or update a fee structure (Bulk components)
export const saveFeeStructure = async (feeData) => {
    try {
        const response = await API.post('/finance/fee-structures', feeData);
        return response.data;
    } catch (error) {
        console.error("Error saving institutional fee structure:", error);
        throw error.response?.data || error.message;
    }
};

// 3. Delete a specific fee entry
export const deleteFeeEntry = async (id) => {
    try {
        const response = await API.delete(`/finance/fee-structures/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting fee entry:", error);
        throw error.response?.data || error.message;
    }
};

// 4. Institutional Global Sync: Trigger bulk ledger assignment
export const syncInstitutionalFees = async (academicYearId) => {
    try {
        const response = await API.post('/finance/sync-institutional-ledger', {
            academic_year_id: academicYearId
        });
        return response.data;
    } catch (error) {
        console.error("Institutional Sync Error:", error);
        throw error.response?.data || error.message;
    }
};

// 5. Fetch Global Transport Fees
export const getTransportFees = async (academicYearId) => {
    try {
        const response = await API.get('/finance/transport-fees', {
            params: { academic_year_id: academicYearId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching transport fees:", error);
        throw error.response?.data || error.message;
    }
};

// 6. Save Global Transport Fees
export const saveTransportFees = async (transportData) => {
    try {
        const response = await API.post('/finance/transport-fees', transportData);
        return response.data;
    } catch (error) {
        console.error("Error saving transport fees:", error);
        throw error.response?.data || error.message;
    }
};
