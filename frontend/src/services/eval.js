import api from './api';

const evalAPI = {
  evaluateTranslation: (payload) => api.post('/eval/translation', payload),
};

export default evalAPI;

