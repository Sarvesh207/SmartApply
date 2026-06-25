import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Resolve the API URL safely for both Jest/Node and Browser environments
const getApiUrl = () => {
  return process.env.VITE_API_URL || 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();

// Create a central axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Central Request Interceptor: Automatically attach the JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Central Response Interceptor: Format errors and handle unauthorized responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message extraction from server response
    const serverMessage = error.response?.data?.error || error.response?.data?.message;
    const errMessage = serverMessage || error.message || 'API request failed';
    
    // Automatically log out user if session expired (unauthorized status)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    
    return Promise.reject(new Error(errMessage));
  }
);

// Backward-compatible wrapper calling the central Axios client
export async function apiFetch<T = any>(endpoint: string, options: any = {}): Promise<T> {
  const method = (options.method || 'GET').toLowerCase();
  
  // Normalize body vs data in axios
  let data = options.body;
  if (data && typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {}
  }

  const response = await apiClient.request({
    url: endpoint,
    method,
    data,
    headers: options.headers,
  });

  return response.data as T;
}
