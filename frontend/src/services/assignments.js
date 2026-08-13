import api from './api';

const assignmentsAPI = {
  create: (payload) => api.post('/assignments', payload),
  update: (id, payload) => api.patch(`/assignments/${id}`, payload),
  remove: (id) => api.delete(`/assignments/${id}`),
  listForClass: (classId, params = {}) => api.get(`/assignments/class/${classId}`, { params }),
  detail: (id) => api.get(`/assignments/${id}`),
  submit: (id, payload) => api.post(`/assignments/${id}/submit`, payload),
  submissionsOf: (id) => api.get(`/assignments/${id}/submissions`),
};

export default assignmentsAPI;

