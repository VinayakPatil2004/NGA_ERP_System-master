import API from './API';

const API_URL = '/timetable';

/**
 * Institutional Timetable Management API Service
 */

export const getSettings = async (academicYearId) => {
    const response = await API.get(`${API_URL}/settings`, { params: { academic_year_id: academicYearId } });
    return response.data;
};

export const saveSettings = async (settings) => {
    const response = await API.post(`${API_URL}/settings`, settings);
    return response.data;
};

export const getSubjectRules = async (classroomId, academicYearId) => {
    const response = await API.get(`${API_URL}/rules`, { params: { classroom_id: classroomId, academic_year_id: academicYearId } });
    return response.data;
};

export const saveSubjectRule = async (ruleData) => {
    const response = await API.post(`${API_URL}/rules`, ruleData);
    return response.data;
};

export const getClassTimetable = async (classroomId, academicYearId) => {
    const response = await API.get(`${API_URL}/class/${classroomId}`, { params: { academic_year_id: academicYearId } });
    return response.data;
};

export const getTeacherTimetable = async (teacherId, academicYearId) => {
    const response = await API.get(`${API_URL}/teacher/${teacherId}`, { params: { academic_year_id: academicYearId } });
    return response.data;
};

export const saveTimetableSlot = async (slotData) => {
    const response = await API.post(`${API_URL}/slot`, slotData);
    return response.data;
};

export const deleteTimetableSlot = async (id) => {
    const response = await API.delete(`${API_URL}/slot/${id}`);
    return response.data;
};

export const autoGenerate = async (classroomId, academicYearId) => {
    const response = await API.post(`${API_URL}/auto-generate`, { classroom_id: classroomId, academic_year_id: academicYearId });
    return response.data;
};
