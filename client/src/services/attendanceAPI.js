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

export const getAttendanceStats = async (params) => {
    const response = await API.get('/attendance/stats', { params });
    return response.data;
};

export const updateAttendanceRecord = async (data) => {
    const response = await API.put('/attendance/record', data);
    return response.data;
};

export const getClassrooms = async (academic_year_id) => {
    const response = await API.get('/classrooms', { params: { academic_year_id } });
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

export const lockStaffAttendance = async (data) => {
    const response = await API.post('/attendance/staff/lock', data);
    return response.data;
};

export const getStudentAttendanceHistory = async (params) => {
    const response = await API.get('/attendance/history/students', { params });
    return response.data;
};

export const getStaffAttendanceHistory = async (params) => {
    const response = await API.get('/attendance/history/staff', { params });
    return response.data;
};

// ================= TEACHER SELF-PUNCH =================

export const getCurrentAttendance = async () => {
    const response = await API.get('/attendance/current');
    return response.data;
};

export const punchIn = async (data, deviceId) => {
    const response = await API.post('/attendance/punch-in', data, {
        headers: { 'x-device-id': deviceId }
    });
    return response.data;
};

export const punchOut = async (data, deviceId) => {
    const response = await API.post('/attendance/punch-out', data, {
        headers: { 'x-device-id': deviceId }
    });
    return response.data;
};

export const startLunch = async () => {
    const response = await API.post('/attendance/lunch-start');
    return response.data;
};

export const endLunch = async () => {
    const response = await API.post('/attendance/lunch-end');
    return response.data;
};

export const startTea = async () => {
    const response = await API.post('/attendance/tea-start');
    return response.data;
};

export const endTea = async () => {
    const response = await API.post('/attendance/tea-end');
    return response.data;
};

export const getAllowedIp = async () => {
    const response = await API.get('/attendance/allowed-ip');
    return response.data;
};

// ================= SETTINGS =================

export const getAttendanceSettings = async () => {
    const response = await API.get('/attendance/settings');
    return response.data;
};

export const updateAttendanceSettings = async (data) => {
    const response = await API.put('/attendance/settings', data);
    return response.data;
};
