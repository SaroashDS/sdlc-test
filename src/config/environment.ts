/**
 * Environment Configuration
 * Centralized configuration for environment variables
 */

interface EnvironmentConfig {
  // Build configuration
  nodeEnv: string;
  version: string;
  buildDate: string;
  
  // API configuration
  apiUrl: string;
  apiVersion: string;
  apiTimeout: number;
  
  // Feature flags
  enableDebug: boolean;
  enableMockApi: boolean;
  enableDevtools: boolean;
  enableAnalytics: boolean;
  
  // Development
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

const config: EnvironmentConfig = {
  // Build configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  version: process.env.REACT_APP_VERSION || '0.1.0',
  buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
  
  // API configuration
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  apiVersion: process.env.REACT_APP_API_VERSION || 'v1',
  apiTimeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
  
  // Feature flags
  enableDebug: process.env.REACT_APP_ENABLE_DEBUG === 'true',
  enableMockApi: process.env.REACT_APP_ENABLE_MOCK_API === 'true',
  enableDevtools: process.env.REACT_APP_ENABLE_DEVTOOLS === 'true',
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  
  // Environment checks
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validation
if (!config.apiUrl) {
  throw new Error('REACT_APP_API_URL is required');
}

// Log configuration in development
if (config.isDevelopment) {
  console.log('Environment Configuration:', {
    nodeEnv: config.nodeEnv,
    apiUrl: config.apiUrl,
    enableDebug: config.enableDebug,
    enableMockApi: config.enableMockApi,
  });
}

export default config;
export type { EnvironmentConfig };
