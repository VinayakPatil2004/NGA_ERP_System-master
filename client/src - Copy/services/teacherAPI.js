import API from './API';

export const getTeacherProfile = async () => {
    const response = await API.get('/teacher/profile');
    return response.data;
};

export const getAnnouncements = async () => {
    const response = await API.get('/teacher/announcements');
    return response.data;
};

export const postAnnouncement = async (message) => {
    const response = await API.post('/teacher/announcements', { message });
    return response.data;
};
