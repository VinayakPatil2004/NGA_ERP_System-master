import API from './API';

const BASE_PATH = '/roles';

export const getAllRoles = async () => {
    const response = await API.get(BASE_PATH);
    return response.data;
};

export const createRole = async (roleName) => {
    const response = await API.post(BASE_PATH, { role_name: roleName });
    return response.data;
};
