import API from './API';

const BASE_PATH = '/admin/profile';

export const getAdminProfile = async () => (await API.get(BASE_PATH)).data;
export const updateAdminProfile = async (data) => (await API.put(BASE_PATH, data)).data;
export const changeAdminPassword = async (data) => (await API.put(`${BASE_PATH}/change-password`, data)).data;
