import api from './api';

const submissionsAPI = {
  getOne: (id) => api.get(`/submissions/${id}`),
  grade: (id, payload) => api.post(`/submissions/${id}/grade`, payload),
};

export default submissionsAPI;

