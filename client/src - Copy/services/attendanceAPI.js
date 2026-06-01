import API from './API';

/**
 * Attendance Service Layer
 * Institutional Presence & Matrix Management API
 */

export const getStudentAttendance = async (params) => {
    const response = await API.get('/attendance/students', { params });
    return response.data;
};

export const getStaffAttendance = async (params) => {
    const response = await API.get('/attendance/staff', { params });
    return response.data;
};

export const getAttendanceStats = async (date) => {
    const response = await API.get('/attendance/stats', { params: { date } });
    return response.data;
};

export const updateAttendanceRecord = async (data) => {
    const response = await API.put('/attendance/record', data);
    return response.data;
};

export const getClassrooms = async () => {
    const response = await API.get('/classrooms');
    return response.data;
};

export const getActiveYear = async () => {
    const response = await API.get('/academic-years/active');
    return response.data;
};

export const markStudentAttendance = async (data) => {
    const response = await API.post('/attendance/students', data);
    return response.data;
};

export const lockStudentAttendance = async (data) => {
    const response = await API.post('/attendance/students/lock', data);
    return response.data;
};

export const markStaffAttendance = async (data) => {
    const response = await API.post('/attendance/staff', data);
    return response.data;
};
