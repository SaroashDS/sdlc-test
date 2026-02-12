import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import apiClient, { ApiError } from './apiClient'; // Assuming the service code is in './apiClient.ts'

// Mock the entire axios module
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Type assertion for the mocked axios
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedApiClient = mockedAxios.create() as jest.Mocked<AxiosInstance>;

describe('apiClient', () => {
  let requestSuccessInterceptor: (
    config: InternalAxiosRequestConfig
  ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  let requestErrorInterceptor: (error: any) => Promise<any>;
  let responseSuccessInterceptor: <T>(response: AxiosResponse<T>) => T;
  let responseErrorInterceptor: (error: AxiosError) => Promise<ApiError>;

  // Mock console.error to prevent logging during tests and to spy on it
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  // Mock localStorage
  const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  beforeAll(() => {
    // This triggers the module to be evaluated, calling axios.create and setting up interceptors
    require('./apiClient');

    // Capture the interceptor functions passed to axios.interceptors.use
    const requestInterceptorArgs = (mockedApiClient.interceptors.request.use as jest.Mock).mock.calls[0];
    requestSuccessInterceptor = requestInterceptorArgs[0];
    requestErrorInterceptor = requestInterceptorArgs[1];

    const responseInterceptorArgs = (mockedApiClient.interceptors.response.use as jest.Mock).mock.calls[0];
    responseSuccessInterceptor = responseInterceptorArgs[0];
    responseErrorInterceptor = responseInterceptorArgs[1];
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Axios Instance Configuration', () => {
    it('should be created with the correct base URL and headers', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: process.env.REACT_APP_API_URL || 'https://api.example.com/v1',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    });
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header if token exists in localStorage', () => {
      const token = 'test-auth-token';
      localStorageMock.setItem('authToken', token);

      const config: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const newConfig = requestSuccessInterceptor(config);

      expect(newConfig.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('should not add Authorization header if token does not exist', () => {
      const config: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const newConfig = requestSuccessInterceptor(config);

      expect(newConfig.headers.Authorization).toBeUndefined();
    });

    it('should handle request configuration errors', async () => {
      const error = new Error('Config error');
      await expect(requestErrorInterceptor(error)).rejects.toThrow(
        'Config error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('[API Request Error]', error);
    });
  });

  describe('Response Interceptor (Success)', () => {
    it('should return the data property directly from the response', () => {
      const responseData = { id: 1, name: 'Test Item' };
      const mockResponse: AxiosResponse = {
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      const result = responseSuccessInterceptor(mockResponse);

      expect(result).toEqual(responseData);
    });
  });

  describe('Response Interceptor (Error)', () => {
    it('should handle server errors (e.g., 500) and return a standardized ApiError', async () => {
      const errorResponseData = { error: 'Internal Server Error' };
      const mockError: AxiosError = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 500',
        config: {} as InternalAxiosRequestConfig,
        response: {
          data: errorResponseData,
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      };

      await expect(responseErrorInterceptor(mockError)).rejects.toEqual({
        message: 'Request failed with status code 500',
        statusCode: 500,
        details: errorResponseData,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[API Response Error]',
        expect.objectContaining({ statusCode: 500 })
      );
    });

    it('should use the message from response data if available', async () => {
      const errorResponseData = { message: 'Invalid input provided' };
      const mockError: AxiosError = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 400',
        config: {} as InternalAxiosRequestConfig,
        response: {
          data: errorResponseData,
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      };

      await expect(responseErrorInterceptor(mockError)).rejects.toEqual({
        message: 'Invalid input provided',
        statusCode: 400,
        details: errorResponseData,
      });
    });

    it('should handle 401 Unauthorized errors and log a specific message', async () => {
      const mockError: AxiosError = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 401',
        config: {} as InternalAxiosRequestConfig,
        response: {
          data: { message: 'Unauthorized' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      };

      await expect(responseErrorInterceptor(mockError)).rejects.toBeDefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Authentication error: Please log in again.'
      );
    });

    it('should handle network errors where no response is received', async () => {
      const mockError: AxiosError = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Network Error',
        config: {} as InternalAxiosRequestConfig,
        request: {}, // Presence of `request` indicates a network error
      };

      await expect(responseErrorInterceptor(mockError)).rejects.toEqual({
        message: 'Network error: No response received from the server.',
        statusCode: 0,
        details: null,
      });
    });

    it('should handle request setup errors', async () => {
      const mockError: AxiosError = {
        isAxiosError: false, // Not an Axios-specific error
        name: 'Error',
        message: 'Something went wrong during request setup',
      };

      await expect(responseErrorInterceptor(mockError)).rejects.toEqual({
        message: 'Something went wrong during request setup',
        statusCode: 500, // Default status code
        details: null,
      });
    });
  });
});