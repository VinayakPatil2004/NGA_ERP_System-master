import API from './API';

/**
 * User & Personnel Service Layer
 * Institutional ID & Access Management Console
 */

export const getAllUsers = async () => {
    const response = await API.get('/users');
    return response.data;
};

export const createUser = async (userData) => {
    const response = await API.post('/users', userData);
    return response.data;
};

export const updateUser = async (id, userData) => {
    const response = await API.put(`/users/${id}`, userData);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await API.delete(`/users/${id}`);
    return response.data;
};

export const toggleBlockUser = async (id, isBlocked) => {
    const response = await API.patch(`/users/${id}/toggle-block`, { is_blocked: isBlocked });
    return response.data;
};

export const getAllRoles = async () => {
    const response = await API.get('/users/roles');
    return response.data;
};

export const createRole = async (roleData) => {
    const response = await API.post('/users/roles', roleData);
    return response.data;
};
