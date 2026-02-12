/**
 * @file Application configuration
 * @description This file contains the application configuration settings.
 * @type {FileType.CONFIG}
 */

// Define a type for the application configuration
interface AppConfig {
  environment: string;
  appName: string;
  apiBaseUrl: string;
  port: number;
  loggingEnabled: boolean;
  // Add other configuration properties as needed
}

// Function to load the configuration from environment variables or a default object
function loadAppConfig(): AppConfig {
  try {
    // Attempt to load configuration from environment variables
    const environment = process.env.NODE_ENV || 'development';
    const appName = process.env.APP_NAME || 'My TypeScript App';
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    const port = parseInt(process.env.PORT || '4000', 10); // Parse port as integer
    const loggingEnabled = process.env.LOGGING_ENABLED === 'true'; // Convert string to boolean

    // Validate the configuration
    if (isNaN(port)) {
      throw new Error('Invalid port number provided in environment variables.');
    }

    const config: AppConfig = {
      environment,
      appName,
      apiBaseUrl,
      port,
      loggingEnabled,
      // Add other configuration properties here
    };

    return config;
  } catch (error) {
    console.error('Error loading application configuration:', error);

    // Fallback to a default configuration if loading from environment variables fails
    const defaultConfig: AppConfig = {
      environment: 'development',
      appName: 'My Default App',
      apiBaseUrl: 'http://localhost:3000/api',
      port: 4000,
      loggingEnabled: true,
    };

    console.warn('Using default application configuration.');
    return defaultConfig;
  }
}

// Export the loaded configuration as a constant
const appConfig: AppConfig = loadAppConfig();

export default appConfig;