import API from './API';

/**
 * Bulk Import Library Books
 */
export const importLibraryBooks = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/library', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Staff
 */
export const importStaff = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/staff', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Students
 */
export const importStudents = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Exam Marks
 */
export const importExamMarks = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/exams', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Inventory
 */
export const importInventory = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/inventory', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Transport Vehicles
 */
export const importVehicles = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/vehicles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Transport Assignments
 */
export const importTransportAssignments = async (file, academicYearId) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post(`/bulk-import/transport-assignments?academicYearId=${academicYearId || ''}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Inventory Suppliers
 */
export const importSuppliers = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/suppliers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Fees
 */
export const importFees = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/fees', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Salary Setup
 */
export const importSalarySetup = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/salary-setup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Staff Payroll
 */
export const importStaffPayroll = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/staff-payroll', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Loan and Advance
 */
export const importLoanAdvance = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/loan-advance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Bulk Import Payroll Record
 */
export const importPayrollRecord = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/bulk-import/payroll-record', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

const bulkImportAPI = {
    importLibraryBooks,
    importStaff,
    importStudents,
    importExamMarks,
    importInventory,
    importVehicles,
    importTransportAssignments,
    importSuppliers,
    importFees,
    importSalarySetup,
    importStaffPayroll,
    importLoanAdvance,
    importPayrollRecord
};

export default bulkImportAPI;
