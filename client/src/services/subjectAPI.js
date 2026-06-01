import API from './API';

export const getSubjectsList = async () => {
    try {
        const response = await API.get('/subjects');
        return response.data;
    } catch (error) {
        console.error("Error fetching subjects:", error);
        throw error.response?.data || error.message;
    }
};

const subjectAPI = {
    getSubjectsList
};

export default subjectAPI;
