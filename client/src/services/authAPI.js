import axios from 'axios';
import { BASE_URL } from './API';
import API from './API';

const API_AUTH_URL = `${BASE_URL}/auth`;

export const login = async (credentials) => {
    try {
        const response = await axios.post(`${API_AUTH_URL}/login`, credentials);
        return response.data;
    } catch (error) {
        console.error("Auth API Error (Login):", error.response?.data || error.message);
        throw error;
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_AUTH_URL}/forgot-password`, { email });
        return response.data;
    } catch (error) {
        console.error("Auth API Error (Forgot):", error.response?.data || error.message);
        throw error;
    }
};

export const resetPassword = async (data) => {
    try {
        const response = await axios.post(`${API_AUTH_URL}/reset-password`, data);
        return response.data;
    } catch (error) {
        console.error("Auth API Error (Reset):", error.response?.data || error.message);
        throw error;
    }
};

export const getDeviceStatus = async () => {
    const response = await API.get('/auth/device-status');
    return response.data;
};

export const bindDevice = async (deviceId) => {
    const response = await API.post('/auth/bind-device', { deviceId });
    return response.data;
};
