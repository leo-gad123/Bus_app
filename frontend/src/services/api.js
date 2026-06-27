import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || (
  window.location.hostname === 'localhost' ? 'https://smart-ebus-backend.onrender.com/api' : '/api'
);
const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  profile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return API.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (data) => API.put('/auth/change-password', data),

};

export const userAPI = {
  topup: (amount) => API.post('/users/topup', { amount }),
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  getStats: () => API.get('/users/stats'),
};

export const busAPI = {
  getAll: () => API.get('/buses'),
  getMy: () => API.get('/buses/my'),
  getById: (id) => API.get(`/buses/${id}`),
  create: (data) => API.post('/buses', data),
  update: (id, data) => API.put(`/buses/${id}`, data),
  delete: (id) => API.delete(`/buses/${id}`),
};

export const routeAPI = {
  getAll: () => API.get('/routes'),
  getAllAdmin: () => API.get('/routes/all'),
  getById: (id) => API.get(`/routes/${id}`),
  create: (data) => API.post('/routes', data),
  update: (id, data) => API.put(`/routes/${id}`, data),
  delete: (id) => API.delete(`/routes/${id}`),
};

export const ticketAPI = {
  purchase: (routeId, beneficiaryName, beneficiaryPhone) => API.post('/tickets/purchase', { routeId, beneficiaryName, beneficiaryPhone }),
  verify: (qrData, busId) => API.post(`/tickets/verify${busId ? `?busId=${busId}` : ''}`, { qrData }),
  my: () => API.get('/tickets/my'),
  getAll: (status) => API.get(`/tickets${status ? `?status=${status}` : ''}`),
  startTrip: (busId) => API.post('/tickets/trip/start', { busId }),
  endTrip: (id) => API.put(`/tickets/trip/${id}/end`),
  activeTrips: () => API.get('/tickets/trips/active'),
  cancel: (id) => API.delete(`/tickets/${id}`),
  adminDelete: (id) => API.delete(`/tickets/admin/${id}`),
};

export default API;
