import axios from 'axios';

/**
 * Determine API Base URL intelligently:
 * 1. Checks VITE_API_BASE_URL environment variable (from .env, .env.production, or Vercel UI).
 * 2. In production builds, falls back to deployed Render backend: https://staffsync-d3z0.onrender.com/api
 * 3. In local development (npm run dev), falls back to local Express server: http://localhost:5000/api
 * 4. Normalizes the URL so that trailing slashes are removed and '/api' is always included.
 */
const resolveBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL;

  if (!url || typeof url !== 'string' || !url.trim()) {
    url = import.meta.env.PROD
      ? 'https://staffsync-d3z0.onrender.com/api'
      : 'http://localhost:5000/api';
  }

  // Remove any trailing whitespace and slashes
  url = url.trim().replace(/\/+$/, '');

  // Ensure path ends with /api (backend mounts all routes under /api/*)
  if (!url.endsWith('/api')) {
    url += '/api';
  }

  return url;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staffsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle global unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthenticated or token expired, clear session
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('staffsync_token');
        localStorage.removeItem('staffsync_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
