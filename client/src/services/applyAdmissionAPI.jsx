import API from './API'

// apply for admission API Call 
/*
export const applyAdmission = async (formData) => {
    try {
        const response = await API.post('/admission/apply', formData)
        return response.data
    } catch (error) {
        console.error("API Error in applyAdmission:", error.response?.data || error.message);
        throw error;
    }
}
*/

// get all applications API Call 
export const getAllApplications = async (academicYear) => {
    try {
        const response = await API.get('/admission/all', { params: { academicYear } })
        return response.data;
    } catch (error) {
        console.error("API Error in getAllApplications:", error.response?.data || error.message);
        throw error;
    }
}

// get application by id API Call 
export const getApplicationById = async (id) => {
    try {
        const response = await API.get(`/admission/${id}`)
        return response.data
    } catch (error) {
        console.error("API Error in getApplicationById:", error.response?.data || error.message);
        throw error;
    }
}

// update application status API Call 
/*
export const updateApplicationStatus = async (id, status) => {
    try {
        const response = await API.put(`/admission/${id}/status`, { status })
        return response.data
    } catch (error) {
        console.error("API Error in updateApplicationStatus:", error.response?.data || error.message);
        throw error;
    }
}
*/

// get admission stats API Call 
export const getAdmissionStats = async (academicYear) => {
    try {
        const response = await API.get('/admission/stats', { params: { academicYear } })
        return response.data;
    } catch (error) {
        console.error("API Error in getAdmissionStats:", error.response?.data || error.message);
        throw error;
    }
}

// delete application API Call 
export const deleteApplication = async (id) => {
    try {
        const response = await API.delete(`/admission/${id}`)
        return response.data
    } catch (error) {
        console.error("API Error in deleteApplication:", error.response?.data || error.message);
        throw error;
    }
}

// Update application details API Call
export const updateApplicationDetails = async (id, details) => {
    try {
        const response = await API.put(`/admission/${id}`, details)
        return response.data
    } catch (error) {
        console.error("API Error in updateApplicationDetails:", error.response?.data || error.message);
        throw error;
    }
}

// Enroll approved application API Call
/*
export const enrollApplication = async (id, enrollmentData) => {
    try {
        const response = await API.post(`/admission/${id}/enroll`, enrollmentData)
        return response.data
    } catch (error) {
        console.error("API Error in enrollApplication:", error.response?.data || error.message);
        throw error;
    }
}
*/

// Direct Enrollment API Call
export const directEnrollStudent = async (formData) => {
    try {
        const response = await API.post('/admission/direct-enroll', formData);
        return response.data;
    } catch (error) {
        console.error("API Error in directEnrollStudent:", error.response?.data || error.message);
        throw error;
    }
}