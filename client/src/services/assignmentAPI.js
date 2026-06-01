import API from './API';

const API_URL = '/assignments';

/**
 * Teacher: Create Assignment
 */
export const createAssignment = async (assignmentData) => {
    const config = (assignmentData instanceof FormData) ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await API.post(`${API_URL}/create`, assignmentData, config);
    return response.data;
};

export const updateAssignment = async (assignmentId, assignmentData) => {
    const config = (assignmentData instanceof FormData) ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await API.put(`${API_URL}/${assignmentId}`, assignmentData, config);
    return response.data;
};

export const deleteAssignment = async (assignmentId) => {
    const response = await API.delete(`${API_URL}/${assignmentId}`);
    return response.data;
};

/**
 * Teacher: Get Assignments for Teacher
 */
export const getTeacherAssignments = async (academicYearId) => {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response = await API.get(`${API_URL}/teacher`, { params });
    return response.data;
};

/**
 * Student/Parent: Get Assignments by Classroom
 */
export const getClassroomAssignments = async (classroomId, studentId = null) => {
    const url = studentId ? `${API_URL}/classroom/${classroomId}?student_id=${studentId}` : `${API_URL}/classroom/${classroomId}`;
    const response = await API.get(url);
    return response.data;
};

/**
 * Student: Submit Assignment
 */
export const submitAssignment = async (submissionData) => {
    const config = (submissionData instanceof FormData) ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await API.post(`${API_URL}/submit`, submissionData, config);
    return response.data;
};

/**
 * Teacher: Get Submissions for Assignment
 */
export const getAssignmentSubmissions = async (assignmentId) => {
    const response = await API.get(`${API_URL}/${assignmentId}/submissions`);
    return response.data;
};

/**
 * Teacher: Grade Submission
 */
export const gradeSubmission = async (submissionId, gradeData) => {
    const response = await API.put(`${API_URL}/submissions/${submissionId}/grade`, gradeData);
    return response.data;
};
