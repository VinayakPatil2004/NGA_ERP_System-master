import axios from 'axios';

/**
 * Institutional API Configuration
 */

// export const BASE_URL = 'http://localhost:5000/api';
// export const ROOT_URL = 'http://localhost:5000';

export const BASE_URL = 'https://erp.backend.amcfest.in/api';
export const ROOT_URL = 'https://erp.backend.amcfest.in';


export const getAuthHeaders = () => {
    const token = localStorage.getItem('slpaems_erp_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

/**
 * Axios Instance
 */
const API = axios.create({
    baseURL: BASE_URL,
});

/**
 *  REQUEST INTERCEPTOR
 */
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('slpaems_erp_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

/**
 * 🔥 RESPONSE INTERCEPTOR
 */
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("[SECURITY] Session expired. Clearing credentials...");

            // Standardized Keys
            localStorage.removeItem('slpaems_erp_token');
            localStorage.removeItem('slpaems_erp_user');

            // Force refresh to trigger AuthContext re-read and ProtectedRoute redirect
            if (window.location.pathname !== '/' && window.location.pathname !== '/administration') {
                window.location.reload();
            }
        }
        return Promise.reject(error);
    }
);

export default API;