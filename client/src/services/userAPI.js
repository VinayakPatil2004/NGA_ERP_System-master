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

export const deleteUser = async (id, type) => {
    const response = await API.delete(`/users/${id}`, { params: { type } });
    return response.data;
};

export const toggleBlockUser = async (id, isBlocked, type) => {
    const response = await API.patch(`/users/${id}/toggle-block`, { is_blocked: isBlocked, type });
    return response.data;
};
