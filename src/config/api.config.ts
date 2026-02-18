/**
 * @file API configuration
 * @description Defines the API endpoints and related configurations.
 */

// Define a type for the API configuration object
interface ApiConfig {
  baseUrl: string;
  timeout: number; // in milliseconds
  headers: Record<string, string>; // Custom headers
}

/**
 * Default API configuration.  Can be overridden by environment variables.
 */
const defaultConfig: ApiConfig = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api', // Fallback to a default URL
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '5000', 10), // Default timeout of 5 seconds
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers here
  },
};

/**
 * Function to merge default config with environment variables.
 * Handles potential errors during parsing.
 */
function loadApiConfig(): ApiConfig {
  try {
    // Create a mutable copy of the default config
    const config: ApiConfig = { ...defaultConfig };

    // Override with environment variables if they exist
    if (process.env.REACT_APP_API_BASE_URL) {
      config.baseUrl = process.env.REACT_APP_API_BASE_URL;
    }

    if (process.env.REACT_APP_API_TIMEOUT) {
      const timeout = parseInt(process.env.REACT_APP_API_TIMEOUT, 10);
      if (!isNaN(timeout)) {
        config.timeout = timeout;
      } else {
        console.error('Invalid API timeout value in environment variable. Using default.');
      }
    }

    return config;
  } catch (error) {
    console.error('Error loading API configuration:', error);
    return defaultConfig; // Return default config in case of error
  }
}

// Export the API configuration
const apiConfig: ApiConfig = loadApiConfig();

export default apiConfig;