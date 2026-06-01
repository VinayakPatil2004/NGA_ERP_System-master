import API from './API';

export const onboardStaff = async (formData) => {
    try {
        const response = await API.post('/staff/onboard', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error onboarding staff:", error);
        throw error;
    }
};

export const getAllStaff = async (filters = {}) => {
    try {
        const response = await API.get('/staff/all', { params: filters });
        return response.data;
    } catch (error) {
        console.error("Error fetching staff:", error);
    }

};

export const getStaffStats = async () => {
    try {
        const response = await API.get('/staff/stats');
        return response.data;
    } catch (error) {
        console.error("Error fetching staff stats:", error);
    }
};

export const getStaffProfile = async (id) => {
    try {
        const response = await API.get(`/staff/profile/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching staff profile:", error);
    }
};

export const updateStaffStatus = async (id, status) => {
    try {
        const response = await API.put(`/staff/status/${id}`, { status });
        return response.data;
    } catch (error) {
        console.error("Error updating staff status:", error);
    }
};

export const updateStaff = async (id, formData) => {
    try {
        const response = await API.put(`/staff/update/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error updating staff:", error);
    }
};

export const deleteStaff = async (id) => {
    try {
        const response = await API.delete(`/staff/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting staff:", error);
    }
};
