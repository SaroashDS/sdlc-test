/**
 * @module apiService
 * @description API service for data fetching.
 */

/**
 * @interface ApiResponse
 * @description Generic interface for API responses.
 * @template T - The type of the data in the response.
 */
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * @interface ApiRequestOptions
 * @description Interface for API request options.
 */
interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: BodyInit;
}

/**
 * @class ApiService
 * @description Provides methods for making API requests.
 */
class ApiService {
  private baseUrl: string;

  /**
   * @constructor
   * @param {string} baseUrl - The base URL for the API.
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * @private
   * @method handleResponse
   * @description Handles the API response and returns the data or an error.
   * @template T - The type of the data in the response.
   * @param {Response} response - The API response.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.message || `HTTP error! Status: ${response.status}`, status: response.status };
      }

      const data = await response.json();
      return { data: data as T, error: null, status: response.status };
    } catch (error: any) {
      return { data: null, error: error.message || 'An unexpected error occurred', status: 500 };
    }
  }

  /**
   * @method get
   * @description Makes a GET request to the specified endpoint.
   * @template T - The type of the data in the response.
   * @param {string} endpoint - The API endpoint.
   * @param {Record<string, string>} [headers] - Optional headers for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const options: ApiRequestOptions = {
      method: 'GET',
      headers: headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, options);
      return this.handleResponse<T>(response);
    } catch (error: any) {
      return { data: null, error: error.message || 'An unexpected error occurred', status: 500 };
    }
  }

  /**
   * @method post
   * @description Makes a POST request to the specified endpoint.
   * @template T - The type of the data in the response.
   * @param {string} endpoint - The API endpoint.
   * @param {any} body - The request body.
   * @param {Record<string, string>} [headers] - Optional headers for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async post<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const options: ApiRequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    };

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, options);
      return this.handleResponse<T>(response);
    } catch (error: any) {
      return { data: null, error: error.message || 'An unexpected error occurred', status: 500 };
    }
  }

  /**
   * @method put
   * @description Makes a PUT request to the specified endpoint.
   * @template T - The type of the data in the response.
   * @param {string} endpoint - The API endpoint.
   * @param {any} body - The request body.
   * @param {Record<string, string>} [headers] - Optional headers for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async put<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const options: ApiRequestOptions = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    };

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, options);
      return this.handleResponse<T>(response);
    } catch (error: any) {
      return { data: null, error: error.message || 'An unexpected error occurred', status: 500 };
    }
  }

  /**
   * @method delete
   * @description Makes a DELETE request to the specified endpoint.
   * @template T - The type of the data in the response.
   * @param {string} endpoint - The API endpoint.
   * @param {Record<string, string>} [headers] - Optional headers for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const options: ApiRequestOptions = {
      method: 'DELETE',
      headers: headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, options);
      return this.handleResponse<T>(response);
    } catch (error: any) {
      return { data: null, error: error.message || 'An unexpected error occurred', status: 500 };
    }
  }

  /**
   * @method patch
   * @description Makes a PATCH request to the specified endpoint.
   * @template T - The type of the data in the response.
   * @param {string} endpoint - The API endpoint.
   * @param {any} body - The request body.
   * @param {Record<string, string>} [headers] - Optional headers for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async patch<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const options: ApiRequestOptions = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    };

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, options);
      return this.handleResponse<T>(response);
    } catch (error: any) {
      return { data: null, error: error.message || 'An unexpected error occurred', status: 500 };
    }
  }
}

export default ApiService;