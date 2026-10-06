import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

// API Base URL
//
// Local development:
//   http://localhost:8080
//
// Production/Vercel:
//   https://doctor-crm-backend.vercel.app
//
// If VITE_API_BASE_URL is available, it will always be used.
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://doctor-crm-backend.vercel.app"
    : "http://localhost:8080");

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
// Automatically attach JWT Bearer token to every request.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: Error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
// Handle unauthorized requests globally.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      // Remove invalid/expired token
      localStorage.removeItem("auth_token");
    }

    return Promise.reject(error);
  }
);

/**
 * Extract a user-friendly error message
 * from API responses or runtime errors.
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Backend returned a message
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Backend returned an error
    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    // Request timeout
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please check your network connection and try again.";
    }

    // Backend unreachable
    if (!error.response) {
      return "Unable to connect to backend server. Please verify the server is running.";
    }

    // Other server errors
    return `Server error (${error.response.status}). Please try again later.`;
  }

  // Normal JavaScript Error
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
};

export default api;