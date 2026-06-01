import API from './API';

export const getAllAcademicYears = async () => {
    const response = await API.get('/academic-years/all');
    return response.data;
};

export const getActiveYear = async () => {
    const response = await API.get('/academic-years/active');
    return response.data;
};

export const addAcademicYear = async (yearData) => {
    const response = await API.post('/academic-years/add', yearData);
    return response.data;
};

export const updateAcademicYear = async (id, yearData) => {
    const response = await API.put(`/academic-years/update/${id}`, yearData);
    return response.data;
};

export const deleteAcademicYear = async (id) => {
    const response = await API.delete(`/academic-years/delete/${id}`);
    return response.data;
};

export const setActiveAcademicYear = async (id) => {
    const response = await API.put(`/academic-years/set-active/${id}`);
    return response.data;
};

export const promoteStudents = async (promotionData) => {
    const response = await API.post('/academic-years/promote', promotionData);
    return response.data;
};
