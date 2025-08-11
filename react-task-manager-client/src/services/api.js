import axios from 'axios';

// Build base URL from env, fallback to local, trim trailing slash
const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

const api = axios.create({
    baseURL: `${API_BASE}/api`,
});

// ----- auth token helpers -----
export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('jwt', token);
    } else {
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('jwt');
    }
}

// Restore token on page reload
const saved = localStorage.getItem('jwt');
if (saved) setAuthToken(saved);

// ----- loading bus -----
let activeRequests = 0;
const listeners = new Set();
function notify() { listeners.forEach(fn => fn(activeRequests)); }

/** Subscribe to loading changes (returns unsubscribe) */
export function onLoadingChange(fn) {
    listeners.add(fn);
    fn(activeRequests); // push current value immediately
    return () => listeners.delete(fn);
}

function isSkipLoading(headers) {
    if (!headers) return false;
    // Axios v1 uses AxiosHeaders which normalizes to lowercase and has get()
    const get = typeof headers.get === 'function'
        ? (k) => headers.get(k)
        : (k) => headers[k] ?? headers[k?.toLowerCase()];
    const v = get('x-skip-loading') ?? get('X-Skip-Loading');
    return v === true || v === 'true' || v === 1 || v === '1';
}

// ----- interceptors (registered at module load) -----
api.interceptors.request.use(
    (config) => {
        // attach token if present (defensive in case defaults were cleared)
        const t = localStorage.getItem('jwt');
        if (t) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${t}`;
        }

        if (!isSkipLoading(config.headers)) {
            // mark this request so we only decrement if we incremented
            config.__loadingCounted = true;
            activeRequests += 1;
            notify();
        }
        return config;
    },
    (error) => {
        if (error?.config?.__loadingCounted) {
            activeRequests = Math.max(0, activeRequests - 1);
            notify();
        }
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        if (response?.config?.__loadingCounted) {
            activeRequests = Math.max(0, activeRequests - 1);
            notify();
        }
        return response;
    },
    (err) => {
        // global 401 handling
        if (err?.response?.status === 401) {
            setAuthToken(null);
            window.location.assign('/login');
        }
        if (err?.config?.__loadingCounted) {
            activeRequests = Math.max(0, activeRequests - 1);
            notify();
        }
        return Promise.reject(err);
    }
);

export default api;
