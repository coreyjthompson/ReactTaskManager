// src/services/api.js
import axios from 'axios';

const api = axios.create({
    // If you're using CRA proxy, keep '/api'.
    // If you call the API directly, use 'https://localhost:7172/api'
    baseURL: '/api'
});

// Store / clear the token and default header
export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('jwt', token);
    } else {
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('jwt');
    }
}

// Attach token to every request automatically
api.interceptors.request.use((config) => {
    const t = localStorage.getItem('jwt');
    if (t) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
});

// Handle 401s globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            // Token is missing/expired/invalid — log out locally
            setAuthToken(null);
            // force the user to login page
            window.location.assign('/login');
        }
        return Promise.reject(err);
    }
);

// Restore token on page reload
const saved = localStorage.getItem('jwt');
if (saved) {
    setAuthToken(saved);
}

export default api;
