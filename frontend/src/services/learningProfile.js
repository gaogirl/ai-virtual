import api from './api';

const learningProfileAPI = {
  mine: () => api.get('/users/me/learning-profile'),
};

export default learningProfileAPI;
