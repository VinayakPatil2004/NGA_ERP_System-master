import API from './API';

/**
 * HR Module API Service
 * Handles institutional Payroll and Leave Management communication.
 */

// ── Payroll Services ────────────────────────────────────────────────────────

/**
 * Fetch payroll records for a specific month and year.
 * @param {number} month - 1 to 12
 * @param {number} year - YYYY
 */
export const getPayrollRegistry = async (month, year) => {
    const response = await API.get('/hr/payroll', { params: { month, year } });
    return response.data;
};

/**
 * Process or Update payroll for one or multiple staff members.
 * @param {Object} data - { month, year, payroll_data: [...] }
 */
export const processPayroll = async (data) => {
    const response = await API.post('/hr/payroll/process', data);
    return response.data;
};

/**
 * Update the status of a specific payroll record (e.g., mark as Paid).
 * @param {number} id - Payroll record ID
 * @param {string} status - 'pending' | 'processed' | 'paid'
 */
export const updatePayrollStatus = async (id, status) => {
    const response = await API.put(`/hr/payroll/${id}/status`, { status });
    return response.data;
};

/**
 * Fetch payroll records for the currently logged-in staff member.
 */
export const getMyPayrollRecords = async () => {
    const response = await API.get('/hr/payroll/my-records');
    return response.data;
};

// ── Leave Management Services ────────────────────────────────────────────────

/**
 * Fetch leave applications with optional filtering.
 * @param {Object} filters - { status, staff_id }
 */
export const getLeaveApplications = async (filters = {}) => {
    const response = await API.get('/hr/leaves', { params: filters });
    return response.data;
};

/**
 * Submit a new leave application.
 * @param {Object} data - { staff_id, leave_type, from_date, to_date, days, reason }
 */
export const applyForLeave = async (data) => {
    const response = await API.post('/hr/leaves', data);
    return response.data;
};

/**
 * Approve or Reject a pending leave application.
 * @param {number} id - Leave record ID
 * @param {Object} actionData - { status: 'approved'|'rejected', review_remarks }
 */
export const reviewLeaveApplication = async (id, actionData) => {
    const response = await API.put(`/hr/leaves/${id}/action`, actionData);
    return response.data;
};

/**
 * Delete a pending leave application.
 * @param {number} id - Leave record ID
 */
export const deleteLeaveApplication = async (id) => {
    const response = await API.delete(`/hr/leaves/${id}`);
    return response.data;
};

/**
 * Fetch leave statistics (counts by status and type).
 */
export const getLeaveStats = async () => {
    const response = await API.get('/hr/leaves/stats');
    return response.data;
};

// ── Salary Structure Services ────────────────────────────────────────────────

export const getSalaryStructures = async () => {
    const response = await API.get('/hr/salary-structures');
    return response.data;
};

export const updateSalaryStructure = async (data) => {
    const response = await API.post('/hr/salary-structures', data);
    return response.data;
};

// ── Loan & Advance Services ──────────────────────────────────────────────────

export const getLoans = async () => {
    const response = await API.get('/hr/loans');
    return response.data;
};

export const createLoan = async (data) => {
    const response = await API.post('/hr/loans', data);
    return response.data;
};

export const updateLoan = async (id, data) => {
    const response = await API.put(`/hr/loans/${id}`, data);
    return response.data;
};

export const deleteLoan = async (id) => {
    const response = await API.delete(`/hr/loans/${id}`);
    return response.data;
};

// ── Profile ──────────────────────────────────────────────────────────────────

export const getProfile = async (id) => {
    const response = await API.get(`/hr/profile/${id}`);
    return response.data;
};

const hrAPI = {
    getPayrollRegistry,
    processPayroll,
    updatePayrollStatus,
    getMyPayrollRecords,
    getLeaveApplications,
    applyForLeave,
    reviewLeaveApplication,
    deleteLeaveApplication,
    getLeaveStats,
    getSalaryStructures,
    updateSalaryStructure,
    getLoans,
    createLoan,
    updateLoan,
    deleteLoan,
    getProfile,
};

export default hrAPI;
