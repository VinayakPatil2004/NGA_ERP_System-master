import axios from 'axios';

/**
 * Institutional API Configuration
 * Centralized registry for the base URL and authentication mechanisms.
 * This simplifies institutional service communication and credential management.
 */

export const BASE_URL = 'http://localhost:5000/api';
export const ROOT_URL = 'http://localhost:5000';

/**
 * Secure Authentication Header Generator
 * Retrieves the 'grace_erp_token' from local storage and returns it in Bearer format.
 * @returns {Object} Headers configuration for Axios or fetch.
 */
export const getAuthHeaders = () => {
    const token = localStorage.getItem('grace_erp_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

/**
 * Institutional Data Instance
 * A pre-configured Axios instance that automatically includes the token.
 */
const API = axios.create({
    baseURL: BASE_URL,
});

// Request Interceptor for automatic institutional credential injection
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('grace_erp_token');
    if (token) {
        // Ensuring header compatibility for current institutional Axios registry (v1.x+)
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor for global security synchronization (401 Handling)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        // If a 401 Unauthorized is detected, the institutional session has expired or is invalid.
        // We Delete the token and redirect to clear the state.
        if (error.response?.status === 401) {
            console.warn("[SECURITY] Stale or invalid session detected. Clearing credentials...");
            localStorage.removeItem('grace_erp_token');
            localStorage.removeItem('grace_erp_user');

            // Redirecting to root for re-authentication
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
