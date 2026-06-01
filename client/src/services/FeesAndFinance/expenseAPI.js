import API from '../API';

/**
 * Institutional Expense Management API
 * Handles all financial outlay operations including CRUD and analytics.
 */

/**
 * Fetch institutional expenses with optional category filtering
 * @param {string} category - Category to filter by (default 'All')
 */
export const getExpenses = async (category = 'All', academicYearId = null) => {
    try {
        let url = category === 'All' ? '/finance/expenses?' : `/finance/expenses?category=${category}&`;
        if (academicYearId) url += `academicYearId=${academicYearId}`;
        const response = await API.get(url);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        throw error;
    }
};

/**
 * Retrieve statistical summary of expenditures
 */
export const getExpenseStats = async (academicYearId = null) => {
    try {
        let url = '/finance/expenses/stats';
        if (academicYearId) url += `?academicYearId=${academicYearId}`;
        const response = await API.get(url);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch expense statistics:", error);
        throw error;
    }
};

/**
 * Record a new institutional expenditure
 * @param {Object} formData - Expense data including payment details
 */
export const createExpense = async (data) => {
    try {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        const response = await API.post('/finance/expenses', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error logging expenditure:", error);
        throw error;
    }
};

/**
 * Update an existing fiscal record
 * @param {number|string} id - Database ID of the expense
 * @param {Object} formData - Updated expense attributes
 */
export const updateExpenseRecord = async (id, data) => {
    try {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        const response = await API.put(`/finance/expenses/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error updating expenditure:", error);
        throw error;
    }
};

/**
 * Permanently remove an expense record from the registry
 * @param {number|string} id - Record ID to delete
 */
export const deleteExpenseRecord = async (id) => {
    try {
        const response = await API.delete(`/finance/expenses/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting record:", error);
        throw error;
    }
};
