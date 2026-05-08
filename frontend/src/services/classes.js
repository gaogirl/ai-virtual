import api from './api';

const classesAPI = {
  create: (payload) => api.post('/classes', payload),
  update: (id, payload) => api.patch(`/classes/${id}`, payload),
  resetInvite: (id, payload) => api.post(`/classes/${id}/reset-invite`, payload),
  join: ({ code }) => api.post('/classes/join', { code }),
  mine: () => api.get('/classes/mine'),
  teaching: () => api.get('/classes/teaching'),
  members: (id) => api.get(`/classes/${id}/members`),
  removeMember: (id, uid) => api.delete(`/classes/${id}/members/${uid}`),
  detail: (id) => api.get(`/classes/${id}`),
  dashboard: (id) => api.get(`/classes/${id}/dashboard`),
};

export default classesAPI;

