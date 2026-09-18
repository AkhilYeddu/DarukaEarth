import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('darukaa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('darukaa_token');
        localStorage.removeItem('darukaa_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const projectAPI = {
  getAll: async () => {
    const res = await api.get('/projects');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/projects', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
  getMacroStats: async () => {
    const res = await api.get('/projects/stats/macro');
    return res.data;
  },
};

export const siteAPI = {
  getAll: async (projectId = null) => {
    const url = projectId ? `/sites?projectId=${projectId}` : '/sites';
    const res = await api.get(url);
    return res.data;
  },
  getGeoJSON: async (projectId = null) => {
    const url = projectId ? `/sites/geojson?projectId=${projectId}` : '/sites/geojson';
    const res = await api.get(url);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/sites/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/sites', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/sites/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/sites/${id}`);
    return res.data;
  },
  getAnalytics: async (siteId) => {
    const res = await api.get(`/sites/${siteId}/analytics`);
    return res.data;
  },
  addAnalytics: async (siteId, data) => {
    const res = await api.post(`/sites/${siteId}/analytics`, data);
    return res.data;
  },
};

export default api;
