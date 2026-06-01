import API from './API';

/**
 * Parent API Service.
 */
export const getChildDetails = async () => {
    try {
        const response = await API.get('/parents/child-details');
        return response.data;
    } catch (error) {
        console.error("Error fetching child details:", error);
        throw error.response?.data || error.message;
    }
};
