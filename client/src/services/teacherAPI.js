import API from './API';

export const getTeacherProfile = async (academicYearId) => {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response = await API.get('/teacher/profile', { params });
    return response.data;
};

export const getAnnouncements = async (academicYearId) => {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response = await API.get('/teacher/announcements', { params });
    return response.data;
};

export const postAnnouncement = async (message, academicYearId) => {
    const response = await API.post('/teacher/announcements', { message, academic_year_id: academicYearId });
    return response.data;
};
export const getNotices = async (academicYearId) => {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response = await API.get('/teacher/notices', { params });
    return response.data;
};
export const login = async (email, password) => {
    const response = await API.post('/teacher/login', { email, password });
    return response.data;
};
