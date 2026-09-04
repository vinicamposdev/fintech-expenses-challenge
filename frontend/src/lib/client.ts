import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const DEFAULT_API_URL = 'http://localhost:3000';


export function resolveBaseUrl(
  apiUrl: string | undefined = import.meta.env.VITE_API_URL,
  isProduction: boolean = import.meta.env.PROD
): string {
  const configured = apiUrl?.trim().replace(/\/+$/, '');

  if (!configured) {
    if (isProduction) {
      console.error(
        'VITE_API_URL is not set - falling back to ' +
          `${DEFAULT_API_URL}. Set it in the deployment environment.`
      );
    }
    return DEFAULT_API_URL;
  }

  return /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
}

export const baseURL = resolveBaseUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 redirects
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl: string = error.config?.url ?? '';
    const isAuthRequest = requestUrl.startsWith('/auth/');

    // A 401 from /auth/* is a bad credential, not an expired session - let the
    // form show the error instead of reloading the page and losing it.
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
