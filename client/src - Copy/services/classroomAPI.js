import API from './API';

/**
 * Institutional Classroom API Service.
 */

export const getClassrooms = async (academicYearId) => {
    try {
        const response = await API.get('/classrooms', {
            params: { academic_year_id: academicYearId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching classrooms:", error);
        throw error.response?.data || error.message;
    }
};

export const getAcademicYearsList = async () => {
    try {
        const response = await API.get('/academic-years/all');
        return response.data;
    } catch (error) {
        console.error("Error fetching academic years:", error);
        throw error.response?.data || error.message;
    }
};
