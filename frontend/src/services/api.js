import axios from 'axios';

const RAW = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = (RAW.endsWith('/api') || RAW.endsWith('/api/')) ? RAW.replace(/\/$/, '') : (RAW.replace(/\/$/, '') + '/api');

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 允许发送cookies
});

// 请求拦截器 - 添加token到请求头
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理网络错误
    if (!error.response) {
      console.error('网络错误：无法连接到服务器。这可能是因为您正在GitHub Pages上访问应用，而后端服务器仅在本地运行。');
      // 可以在这里添加一些用户友好的提示
    }

    const token = localStorage.getItem('token');
    // 若是本地模式（local- 开头的 token），不要因 401 强制跳转
    if (error.response?.status === 401 && !(token && token.startsWith('local-'))) {
      // token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// 课程相关API（示例约定，后端可按需适配）
export const coursesAPI = {
  // 班级
  listClasses: () => api.get('/courses/classes'),
  joinClass: (code) => api.post('/courses/join', { code }),
  leaveClass: (classId) => api.delete(`/courses/classes/${classId}`),

  // 术语库
  listTerms: (params) => api.get('/courses/terms', { params }),
  createTerm: (payload) => api.post('/courses/terms', payload),
  updateTerm: (id, payload) => api.put(`/courses/terms/${id}`, payload),
  deleteTerm: (id) => api.delete(`/courses/terms/${id}`),

  // 案例库
  listCases: (params) => api.get('/courses/cases', { params }),
  createCase: (payload) => api.post('/courses/cases', payload),
  updateCase: (id, payload) => api.put(`/courses/cases/${id}`, payload),
  deleteCase: (id) => api.delete(`/courses/cases/${id}`),
};

export default api;


