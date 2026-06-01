import API from './API';

const certificateAPI = {
    // Student requests
    getMyRequests: async () => {
        const response = await API.get('/certificates/my-requests');
        return response.data;
    },
    requestCertificate: async (data) => {
        const response = await API.post('/certificates/request', data);
        return response.data;
    },

    // Teacher/Admin actions
    getAllRequests: async (params) => {
        const response = await API.get('/certificates', { params });
        return response.data;
    },
    teacherApprove: async (id) => {
        const response = await API.put(`/certificates/${id}/teacher-approve`);
        return response.data;
    },
    adminApprove: async (id) => {
        const response = await API.put(`/certificates/${id}/admin-approve`);
        return response.data;
    },
    principalApprove: async (id) => {
        const response = await API.put(`/certificates/${id}/principal-approve`);
        return response.data;
    },
    generateCertificate: (id) => {
        // Return URL for download
        return `${API.defaults.baseURL}/certificates/${id}/generate`;
    },

    // LC Specific
    getMyLCRequests: async () => {
        const response = await API.get('/certificates/my-requests', { params: { cert_type: 'leaving' } });
        return response.data;
    },
    requestLC: async (data) => {
        const response = await API.post('/certificates/request', { ...data, cert_type: 'leaving' });
        return response.data;
    },
    getAllLCRequests: async (params) => {
        const response = await API.get('/certificates', { params: { ...params, cert_type: 'leaving' } });
        return response.data;
    },
    teacherApproveLC: async (id) => {
        const response = await API.put(`/certificates/${id}/teacher-approve`);
        return response.data;
    },
    adminApproveLC: async (id) => {
        const response = await API.put(`/certificates/${id}/admin-approve`);
        return response.data;
    },
    principalApproveLC: async (id) => {
        const response = await API.put(`/certificates/${id}/principal-approve`);
        return response.data;
    },
    generateLC: (id) => {
        // Return URL for download
        return `${API.defaults.baseURL}/certificates/${id}/generate`;
    }
};

export default certificateAPI;
