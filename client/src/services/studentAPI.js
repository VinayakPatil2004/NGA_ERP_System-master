import API from './API';

/**
 * Fetch all students filtered by academic year and optional grade.
 * @param {string} academicYear - The academic year name (e.g., '2025-26')
 * @param {string} grade - Optional grade filter (e.g., '5th')
 * @returns {Promise<Array>} List of student records
 */
export const getAllStudents = async (academicYear, grade = '', classroom_id = '') => {
    try {
        const response = await API.get('/students/all', {
            params: { academicYear, grade, classroom_id }
        });
        return response.data;
    } catch (error) {
        console.error("API Error in getAllStudents:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetch full student profile details by system ID.
 * @param {number|string} id - Database ID of the student
 * @returns {Promise<Object>} Full student profile data
 */
export const getStudentById = async (id) => {
    try {
        const response = await API.get(`/students/${id}`);
        return response.data;
    } catch (error) {
        console.error("API Error in getStudentById:", error.response?.data || error.message);
        throw error;
    }
};

export const updateStudent = async (id, studentData) => {
    try {
        const response = await API.put(`/students/${id}`, studentData);
        return response.data;
    } catch (error) {
        console.error("API Error in updateStudent:", error.response?.data || error.message);
        throw error;
    }
};

export const getStudentAcademicRecords = async (id) => {
    try {
        const response = await API.get(`/academic-records/student/${id}`);
        return response.data;
    } catch (error) {
        console.error("API Error in getStudentAcademicRecords:", error.response?.data || error.message);
        throw error;
    }
};

export const getStudentAttendanceSummary = async (id) => {
    try {
        const response = await API.get(`/attendance/students`, { params: { student_id: id } });
        return response.data;
    } catch (error) {
        console.error("API Error in getStudentAttendanceSummary:", error.response?.data || error.message);
        throw error;
    }
};

export const getStudentAttendanceRecords = async (id, academicYearId) => {
    try {
        const response = await API.get(`/students/${id}/attendance`, { params: { academicYearId } });
        return response.data;
    } catch (error) {
        console.error("API Error in getStudentAttendanceRecords:", error.response?.data || error.message);
        throw error;
    }
};

export const getStudentExams = async (id, academicYearId) => {
    try {
        const response = await API.get(`/students/${id}/exams`, { params: { academicYearId } });
        return response.data;
    } catch (error) {
        console.error("API Error in getStudentExams:", error.response?.data || error.message);
        throw error;
    }
};

export const getStudentFees = async (id, academicYearId) => {
    try {
        const response = await API.get(`/students/${id}/fees`, { params: { academicYearId } });
        return response.data;
    } catch (error) {
        console.error("API Error in getStudentFees:", error.response?.data || error.message);
        throw error;
    }
};

export const getAcademicYearsList = async () => {
    try {
        const response = await API.get(`/academic-years/all`);
        return response.data;
    } catch (error) {
        console.error("API Error in getAcademicYearsList:", error.response?.data || error.message);
        throw error;
    }
};

export const getActiveAcademicYear = async () => {
    try {
        const response = await API.get(`/academic-years/active`);
        return response.data;
    } catch (error) {
        console.error("API Error in getActiveAcademicYear:", error.response?.data || error.message);
        throw error;
    }
};

export const addStudentFee = async (id, feeData) => {
    try {
        const response = await API.post(`/students/${id}/fees`, feeData);
        return response.data;
    } catch (error) {
        console.error("API Error in addStudentFee:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Bulk promote students to the next grade and academic year.
 * Grade is determined automatically by the server. 10th-grade students are archived.
 * @param {Array} studentIds - Array of student IDs to promote
 * @param {number} nextYearId - ID of the target academic year
 */
export const promoteStudents = async (studentIds, nextYearId) => {
    try {
        const response = await API.post('/students/promote', {
            studentIds,
            nextYearId
        });
        return response.data;
    } catch (error) {
        console.error("API Error in promoteStudents:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Transition a student to the Alumni archive.
 * @param {number|string} id - Student ID
 * @param {string} leavingDate - Date of leaving (YYYY-MM-DD)
 * @param {string} reason - Reason for leaving
 */
export const archiveStudent = async (id, leavingDate, reason) => {
    try {
        const response = await API.post(`/students/${id}/archive`, {
            leavingDate,
            reason
        });
        return response.data;
    } catch (error) {
        console.error("API Error in archiveStudent:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetch all archived alumni records.
 * @returns {Promise<Array>} List of alumni
 */
export const getAlumniRecords = async () => {
    try {
        const response = await API.get('/students/alumni');
        return response.data;
    } catch (error) {
        console.error("API Error in getAlumniRecords:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Permanently Delete a student record and associated credentials.
 * @param {number|string} id - Student ID
 */
export const deleteStudent = async (id) => {
    try {
        const response = await API.delete(`/students/${id}`);
        return response.data;
    } catch (error) {
        console.error("API Error in deleteStudent:", error.response?.data || error.message);
        throw error;
    }
};

export const applyStudentLeave = async (studentId, leaveData) => {
    try {
        const response = await API.post(`/students/${studentId}/leaves`, leaveData);
        return response.data;
    } catch (error) {
        console.error("API Error in applyStudentLeave:", error.response?.data || error.message);
        throw error;
    }
};

export const getStudentLeaves = async (studentId) => {
    try {
        const response = await API.get(`/students/${studentId}/leaves`);
        return response.data;
    } catch (error) {
        console.error("API Error in getStudentLeaves:", error.response?.data || error.message);
        throw error;
    }
};

export const getAllStudentLeaves = async (status = '', grade = '') => {
    try {
        const response = await API.get('/students/all/leaves', { params: { status, grade } });
        return response.data;
    } catch (error) {
        console.error("API Error in getAllStudentLeaves:", error.response?.data || error.message);
        throw error;
    }
};

export const reviewStudentLeave = async (leaveId, reviewData) => {
    try {
        const response = await API.put(`/students/leaves/${leaveId}/review`, reviewData);
        return response.data;
    } catch (error) {
        console.error("API Error in reviewStudentLeave:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Bulk import students from Excel/CSV/PDF
 * @param {File} file - The file to upload
 */
export const importStudents = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await API.post('/bulk-import/students', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("API Error in importStudents:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Bulk upload student documents (photos, certificates, etc.)
 * Files must be named GRNO_TYPE.ext
 * @param {Array<File>} files - Array of files to upload
 */
export const bulkUploadStudentDocuments = async (files) => {
    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        const response = await API.post('/students/bulk-documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("API Error in bulkUploadStudentDocuments:", error.response?.data || error.message);
        throw error;
    }
};
