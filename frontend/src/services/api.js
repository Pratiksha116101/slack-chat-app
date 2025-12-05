import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (username, email, password) =>
    apiClient.post('/auth/register', { username, email, password }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password })
};

export const channelsApi = {
  getAll: () => apiClient.get('/channels'),
  create: (name, description) =>
    apiClient.post('/channels', { name, description }),
  getById: (id) => apiClient.get(`/channels/${id}`),
  join: (id) => apiClient.post(`/channels/${id}/join`),
  leave: (id) => apiClient.post(`/channels/${id}/leave`)
};

export const messagesApi = {
  getByChannel: (channelId, limit = 50, skip = 0) =>
    apiClient.get(`/messages/channel/${channelId}?limit=${limit}&skip=${skip}`),
  create: (content, channelId) =>
    apiClient.post('/messages', { content, channelId }),
  update: (id, content) =>
    apiClient.put(`/messages/${id}`, { content }),
  delete: (id) => apiClient.delete(`/messages/${id}`)
};

export default apiClient;
