import api from './api';

const libraryAPI = {
  // Terms
  listTerms: (params = {}) => api.get('/library/terms', { params }),
  createTerm: (payload) => api.post('/library/terms', payload),
  updateTerm: (id, payload) => api.patch(`/library/terms/${id}`, payload),
  deleteTerm: (id) => api.delete(`/library/terms/${id}`),

  // Cases
  listCases: (params = {}) => api.get('/library/cases', { params }),
  getCase: (id) => api.get(`/library/cases/${id}`),
  createCase: (payload) => api.post('/library/cases', payload),
  updateCase: (id, payload) => api.patch(`/library/cases/${id}`, payload),
  deleteCase: (id) => api.delete(`/library/cases/${id}`),
};

export default libraryAPI;

