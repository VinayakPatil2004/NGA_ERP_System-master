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
export const getClassSubjects = async (classroomId, academicYearId) => {
    try {
        const response = await API.get(`/classrooms/${classroomId}/subjects`, {
            params: { academic_year_id: academicYearId }
        });
        return response.data;

    } catch (error) {
        console.error("Error fetching classroom subjects:", error);
        throw error.response?.data || error.message;
    }
};

export const getStudentsByClassroom = async (classroomId, academicYearId) => {
    try {
        const response = await API.get(`/classrooms/${classroomId}/students`, {
            params: { academic_year_id: academicYearId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching enrolled students:", error);
        throw error.response?.data || error.message;
    }
};
