import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);

// Businesses
export const fetchBusinesses = (lat, lng, dist, category) => {
  const params = new URLSearchParams({ lat, lng, dist });
  if (category) params.append('category', category);
  return API.get(`/businesses?${params}`);
};
export const fetchBusiness = (id) => API.get(`/businesses/${id}`);
export const createBusiness = (data) => API.post('/businesses', data);
export const updateBusiness = (id, data) => API.put(`/businesses/${id}`, data);
export const deleteBusiness = (id) => API.delete(`/businesses/${id}`);

// Reviews
export const addReview = (businessId, data) => API.post(`/businesses/${businessId}/reviews`, data);