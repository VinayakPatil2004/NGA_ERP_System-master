import API from './API';

const API_URL = '/exams';

/**
 * Institutional Exam Management API Service
 * Centralized via API.js for unified authentication and error handling.
 */

// --- Exams ---
export const getAllExams = async (academicYearId) => {
    const url = academicYearId ? `${API_URL}?academic_year_id=${academicYearId}` : API_URL;
    const response = await API.get(url);
    return response.data;
};

export const createExam = async (examData) => {
    const response = await API.post(API_URL, examData);
    return response.data;
};

export const updateExam = async (id, examData) => {
    const response = await API.put(`${API_URL}/${id}`, examData);
    return response.data;
};

export const deleteExam = async (id) => {
    const response = await API.delete(`${API_URL}/${id}`);
    return response.data;
};

export const updateExamStatus = async (id, status) => {
    const response = await API.put(`${API_URL}/${id}/status`, { status });
    return response.data;
};

// --- Settings ---
export const getExamSettings = async (examId) => {
    const response = await API.get(`${API_URL}/settings/${examId}`);
    return response.data;
};

export const saveExamSettings = async (settings) => {
    const response = await API.post(`${API_URL}/settings`, settings);
    return response.data;
};

// --- Timetable ---
export const getExamTimetable = async (examId, classroomId) => {
    const response = await API.get(`${API_URL}/timetable`, { params: { exam_id: examId, classroom_id: classroomId } });
    return response.data;
};

export const saveExamTimetable = async (timetableData) => {
    const response = await API.post(`${API_URL}/timetable`, timetableData);
    return response.data;
};

// --- Grading ---
export const getGradingSystem = async () => {
    const response = await API.get(`${API_URL}/grading`);
    return response.data;
};

export const saveGradingSystem = async (gradeData) => {
    const response = await API.post(`${API_URL}/grading`, gradeData);
    return response.data;
};

// --- Marks ---
export const getMarksBatch = async (examId, classroomId, subjectName, academicYearId) => {
    const response = await API.get(`${API_URL}/marks-batch`, { params: { exam_id: examId, classroom_id: classroomId, subject_name: subjectName, academic_year_id: academicYearId } });
    return response.data;
};

export const saveMarks = async (marksData) => {
    const response = await API.post(`${API_URL}/marks`, marksData);
    return response.data;
};

export const downloadMarksTemplate = async (classroomId) => {
    const response = await API.get(`${API_URL}/download-template`, {
        params: { classroom_id: classroomId },
        responseType: 'blob'
    });
    return response.data;
};

export const bulkUploadMarks = async (examId, subjectName, file) => {
    const formData = new FormData();
    formData.append('exam_id', examId);
    formData.append('subject_name', subjectName);
    formData.append('file', file);
    
    // API service handles multipart automatically via axios, but we can be explicit
    const response = await API.post(`${API_URL}/bulk-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// --- Co-Scholastic ---
export const getCoScholastic = async (studentId, academicYearId) => {
    const response = await API.get(`${API_URL}/co-scholastic`, { params: { student_id: studentId, academic_year_id: academicYearId } });
    return response.data;
};

export const saveCoScholastic = async (coMarksData) => {
    const response = await API.post(`${API_URL}/co-scholastic`, coMarksData);
    return response.data;
};

export const downloadReportCard = async (studentId, academicYearId, term, classroomId = null) => {
    const params = { student_id: studentId, academic_year_id: academicYearId, term: term };
    if (classroomId) params.classroom_id = classroomId;
    const response = await API.get(`${API_URL}/report-card`, {
        params,
        responseType: 'blob'
    });
    return response.data;
};

export const getStudentPerformance = async (studentId, academicYearId) => {
    const response = await API.get(`${API_URL}/performance`, { params: { student_id: studentId, academic_year_id: academicYearId } });
    return response.data;
};

export const deleteMark = async (id) => {
    const response = await API.delete(`${API_URL}/marks/${id}`);
    return response.data;
};

// --- Pre-Primary ---
export const getPrePrimaryMarks = async (studentId, term, academicYearId) => {
    const response = await API.get(`${API_URL}/pre-primary-marks`, { params: { student_id: studentId, term: term, academic_year_id: academicYearId } });
    return response.data;
};

export const savePrePrimaryMarks = async (data) => {
    const response = await API.post(`${API_URL}/pre-primary-marks`, data);
    return response.data;
};
