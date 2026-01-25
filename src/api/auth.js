import api from './client';

export const login = (payload) => api.post('/auth/login', payload);

export const register = (payload) => api.post('/auth/register', payload);

export const logout = () => api.post('/auth/logout');

export const getCurrentUser = () => api.get('/user');
