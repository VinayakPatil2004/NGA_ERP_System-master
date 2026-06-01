import API from './API';

const API_URL = '/counsellor';

/**
 * Institutional Counsellor API Service
 * Standardized via API.js for unified authentication and interceptors.
 */

export const createEnquiry = async (data) => {
    const response = await API.post(`${API_URL}/enquiry`, data);
    return response.data;
};

export const getAllEnquiries = async (academicYearId) => {
    const response = await API.get(`${API_URL}/enquiry/all`, { 
        params: { academicYearId } 
    });
    return response.data;
};

export const createFollowup = async (data) => {
    const response = await API.post(`${API_URL}/followup`, data);
    return response.data;
};

export const getEnquiryFollowups = async (enquiryId) => {
    const response = await API.get(`${API_URL}/followup/${enquiryId}`);
    return response.data;
};

export const getFollowupsDue = async (academicYearId) => {
    const response = await API.get(`${API_URL}/followup/due`, {
        params: { academicYearId }
    });
    return response.data;
};

export const scheduleSession = async (data) => {
    const response = await API.post(`${API_URL}/session`, data);
    return response.data;
};

export const getAllSessions = async (academicYearId) => {
    const response = await API.get(`${API_URL}/session/all`, {
        params: { academicYearId }
    });
    return response.data;
};

export const getCounsellorStats = async (academicYearId) => {
    const response = await API.get(`${API_URL}/stats`, {
        params: { academicYearId }
    });
    return response.data;
};

export const updateEnquiry = async (id, data) => {
    const response = await API.put(`${API_URL}/enquiry/${id}`, data);
    return response.data;
};

export const deleteEnquiry = async (id) => {
    const response = await API.delete(`${API_URL}/enquiry/${id}`);
    return response.data;
};
