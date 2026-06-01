import API from '../API';

/**
 * CA Finance Report Management API
 */

export const getCAReports = async (search = '', academicYearId = null) => {
    try {
        let url = '/finance/ca-reports?';
        if (search) url += `search=${search}&`;
        if (academicYearId) url += `academicYearId=${academicYearId}`;
        const response = await API.get(url);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch CA reports:", error);
        throw error;
    }
};

export const createCAReport = async (data) => {
    try {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        const response = await API.post('/finance/ca-reports', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error creating CA report:", error);
        throw error;
    }
};

export const updateCAReport = async (id, data) => {
    try {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        const response = await API.put(`/finance/ca-reports/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error updating CA report:", error);
        throw error;
    }
};

export const deleteCAReport = async (id) => {
    try {
        const response = await API.delete(`/finance/ca-reports/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting CA report record:", error);
        throw error;
    }
};
