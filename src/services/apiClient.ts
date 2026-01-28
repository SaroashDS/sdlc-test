import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

/**
 * @interface ApiError
 * @description Standardized error structure for API responses.
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

/**
 * @interface ApiResponse
 * @description Generic wrapper for successful API responses.
 * @template T The type of the data payload.
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * @description Axios instance configured for API communication.
 *
 * This instance includes:
 * - A base URL sourced from environment variables.
 * - Default headers for JSON content.
 * - A request interceptor to inject authentication tokens.
 * - A response interceptor for centralized success and error handling.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://api.example.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

/**
 * Request Interceptor
 *
 * @description This interceptor runs before each request is sent.
 * It's used to add the authentication token to the request headers.
 * @param {InternalAxiosRequestConfig} config The Axios request configuration.
 * @returns {InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>} The modified config.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // --- AUTH TOKEN LOGIC ---
    // Example: Retrieve a token from local storage or a state manager.
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    // Handle request configuration errors
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * @description This interceptor runs for each response received.
 * It centralizes response handling, processing both successful responses and errors.
 * @param {AxiosResponse} response The successful Axios response.
 * @returns {T} The data from the response.
 * @param {AxiosError<ApiError>} error The Axios error object.
 * @returns {Promise<ApiError>} A rejected promise with a standardized error object.
 */
apiClient.interceptors.response.use(
  <T>(response: AxiosResponse<T>): T => {
    // For successful responses, we directly return the data payload.
    // If your API wraps responses (e.g., { data: { ... } }), you can unwrap it here.
    // Example: return response.data.data;
    return response.data;
  },
  async (error: AxiosError): Promise<ApiError> => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred.',
      statusCode: 500,
      details: null,
    };

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      apiError.statusCode = error.response.status;
      apiError.message =
        (error.response.data as any)?.message || error.message;
      apiError.details = error.response.data;

      // Example: Handle specific status codes like 401 for token refresh
      if (error.response.status === 401) {
        // Here you could implement token refresh logic.
        // For example:
        // const newAccessToken = await refreshToken();
        // if (newAccessToken) {
        //   // Retry the original request with the new token
        //   error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
        //   return apiClient.request(error.config);
        // }
        console.error('Authentication error: Please log in again.');
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser
      apiError.message =
        'Network error: No response received from the server.';
      apiError.statusCode = 0; // Indicates a client-side/network error
    } else {
      // Something happened in setting up the request that triggered an Error
      apiError.message = error.message;
    }

    console.error('[API Response Error]', apiError);

    // Reject the promise with our standardized error object
    return Promise.reject(apiError);
  }
);

export default apiClient;