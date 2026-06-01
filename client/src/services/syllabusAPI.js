import API from './API';

export const getSyllabusProgress = async (classroomId, params = {}) => {
    const response = await API.get(`/syllabus/classroom/${classroomId}`, { params });
    return response.data;
};

export const addSyllabusTopic = async (data) => {
    const response = await API.post('/syllabus', data);
    return response.data;
};

export const updateTopicStatus = async (id, data) => {
    const response = await API.put(`/syllabus/${id}`, data);
    return response.data;
};

export const getDailyReport = async (classroomId, params = {}) => {
    const response = await API.get(`/syllabus/daily/${classroomId}`, { params });
    return response.data;
};

export const getMasterSyllabus = async (classroomId) => {
    const response = await API.get(`/syllabus/master/${classroomId}`);
    return response.data;
};

export const addMasterSyllabusTopic = async (data) => {
    const response = await API.post('/syllabus/master', data);
    return response.data;
};

export const updateMasterSyllabusTopic = async (id, data) => {
    const response = await API.put(`/syllabus/master/${id}`, data);
    return response.data;
};

export const deleteMasterSyllabusTopic = async (id) => {
    const response = await API.delete(`/syllabus/master/${id}`);
    return response.data;
};

const syllabusAPI = {
    getSyllabusProgress,
    addSyllabusTopic,
    updateTopicStatus,
    getDailyReport,
    getMasterSyllabus,
    addMasterSyllabusTopic,
    updateMasterSyllabusTopic,
    deleteMasterSyllabusTopic
};

export default syllabusAPI;
