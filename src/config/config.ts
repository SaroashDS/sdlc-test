/**
 * @file Configuration file
 * @description This file contains the configuration settings for the application.
 */

// Define a type for the configuration object
interface Config {
  environment: string;
  apiEndpoint: string;
  port: number;
  databaseUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  [key: string]: any; // Allow for additional, unspecified configuration options
}

// Function to load environment variables and create the configuration object
function loadConfig(): Config {
  try {
    // Get the environment from the environment variables, defaulting to 'development'
    const environment = process.env.NODE_ENV || 'development';

    // Load environment-specific configuration
    let apiEndpoint: string;
    let port: number;
    let databaseUrl: string;
    let logLevel: 'debug' | 'info' | 'warn' | 'error';

    if (environment === 'production') {
      apiEndpoint = process.env.PRODUCTION_API_ENDPOINT || 'https://api.example.com';
      port = parseInt(process.env.PRODUCTION_PORT || '8080', 10);
      databaseUrl = process.env.PRODUCTION_DATABASE_URL || 'mongodb://user:pass@host:port/db';
      logLevel = (process.env.PRODUCTION_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info';
    } else if (environment === 'staging') {
      apiEndpoint = process.env.STAGING_API_ENDPOINT || 'https://staging.api.example.com';
      port = parseInt(process.env.STAGING_PORT || '8081', 10);
      databaseUrl = process.env.STAGING_DATABASE_URL || 'mongodb://user:pass@host:port/staging_db';
      logLevel = (process.env.STAGING_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info';
    } else { // Default to development
      apiEndpoint = process.env.DEVELOPMENT_API_ENDPOINT || 'http://localhost:3000';
      port = parseInt(process.env.DEVELOPMENT_PORT || '3000', 10);
      databaseUrl = process.env.DEVELOPMENT_DATABASE_URL || 'mongodb://localhost:27017/dev_db';
      logLevel = (process.env.DEVELOPMENT_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'debug';
    }

    // Validate the port number
    if (isNaN(port)) {
      throw new Error('Invalid port number.  Please check your environment variables.');
    }

    // Create the configuration object
    const config: Config = {
      environment,
      apiEndpoint,
      port,
      databaseUrl,
      logLevel,
    };

    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw error; // Re-throw the error to prevent the application from starting with invalid configuration
  }
}

// Export the configuration object
const config: Config = loadConfig();
export default config;