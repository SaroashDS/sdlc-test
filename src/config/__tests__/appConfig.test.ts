// appConfig.test.ts
import appConfig from './appConfig';
import { loadAppConfig } from './appConfig';

describe('appConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; // Copy original env to avoid mutation
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadAppConfig', () => {
    it('should load configuration from environment variables', () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_NAME = 'My Production App';
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.PORT = '8080';
      process.env.LOGGING_ENABLED = 'false';

      const config = loadAppConfig();

      expect(config.environment).toBe('production');
      expect(config.appName).toBe('My Production App');
      expect(config.apiBaseUrl).toBe('https://api.example.com');
      expect(config.port).toBe(8080);
      expect(config.loggingEnabled).toBe(false);
    });

    it('should use default configuration when environment variables are not set', () => {
      delete process.env.NODE_ENV;
      delete process.env.APP_NAME;
      delete process.env.API_BASE_URL;
      delete process.env.PORT;
      delete process.env.LOGGING_ENABLED;

      const config = loadAppConfig();

      expect(config.environment).toBe('development');
      expect(config.appName).toBe('My Default App');
      expect(config.apiBaseUrl).toBe('http://localhost:3000/api');
      expect(config.port).toBe(4000);
      expect(config.loggingEnabled).toBe(true);
    });

    it('should handle invalid port number and fallback to default configuration', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.PORT = 'invalid-port';

      const config = loadAppConfig();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading application configuration:',
        new Error('Invalid port number provided in environment variables.')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith('Using default application configuration.');
      expect(config.port).toBe(4000);
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should handle missing environment variables and fallback to default configuration', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      process.env = {};

      const config = loadAppConfig();

      expect(config.environment).toBe('development');
      expect(config.appName).toBe('My Default App');
      expect(config.apiBaseUrl).toBe('http://localhost:3000/api');
      expect(config.port).toBe(4000);
      expect(config.loggingEnabled).toBe(true);
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('appConfig export', () => {
    it('should export the loaded configuration', () => {
      process.env.NODE_ENV = 'test';
      process.env.APP_NAME = 'Test App';
      process.env.API_BASE_URL = 'http://test.com/api';
      process.env.PORT = '5000';
      process.env.LOGGING_ENABLED = 'true';

      const config = appConfig;

      expect(config.environment).toBe('test');
      expect(config.appName).toBe('Test App');
      expect(config.apiBaseUrl).toBe('http://test.com/api');
      expect(config.port).toBe(5000);
      expect(config.loggingEnabled).toBe(true);
    });
  });
});