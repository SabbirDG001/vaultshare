import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        response: { data: { message: 'Request timed out. Please try again.' } },
      });
    }

    if (!error.response) {
      return Promise.reject({
        response: { data: { message: 'Cannot connect to server. Is it running?' } },
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;