/**
 * @file API configuration
 * @description Defines the base URL and other settings for making API requests.
 */

// Define an interface for the API configuration
interface ApiConfig {
  /**
   * The base URL of the API.
   * @example 'https://api.example.com'
   */
  baseUrl: string;

  /**
   * The timeout for API requests in milliseconds.
   * @default 5000 (5 seconds)
   */
  timeout?: number;

  /**
   * Optional headers to include in every API request.
   */
  headers?: Record<string, string>;
}

/**
 * Configuration object for the API.
 *
 * @remarks
 * This object contains the base URL and other settings required to make API requests.
 * It's important to configure this object correctly for the application to function properly.
 */
const apiConfig: ApiConfig = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000', // Default to localhost if not set in environment
  timeout: 5000, // 5 seconds
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers here
  },
};

/**
 * Gets the API configuration.
 *
 * @returns The API configuration object.
 */
export const getApiConfig = (): ApiConfig => {
  if (!apiConfig.baseUrl) {
    console.error('API base URL is not configured.');
    throw new Error('API base URL is not configured.'); // Or return a default config
  }
  return apiConfig;
};

/**
 * Helper function to construct a full API URL.
 *
 * @param endpoint - The API endpoint to append to the base URL.
 * @returns The full API URL.
 */
export const constructApiUrl = (endpoint: string): string => {
  const config = getApiConfig();
  return `${config.baseUrl}/${endpoint}`;
};