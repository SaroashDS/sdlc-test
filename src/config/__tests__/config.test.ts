// config.test.ts
import config from './config';
import { loadConfig } from './config';

describe('Config Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; // Copy original env vars
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original env vars
  });

  describe('loadConfig Function', () => {
    it('should load default development configuration when no environment variables are set', () => {
      const config = loadConfig();
      expect(config.environment).toBe('development');
      expect(config.apiEndpoint).toBe('http://localhost:3000');
      expect(config.port).toBe(3000);
      expect(config.databaseUrl).toBe('mongodb://localhost:27017/dev_db');
      expect(config.logLevel).toBe('debug');
    });

    it('should load production configuration when NODE_ENV is set to production', () => {
      process.env.NODE_ENV = 'production';
      process.env.PRODUCTION_API_ENDPOINT = 'https://prod.api.com';
      process.env.PRODUCTION_PORT = '8081';
      process.env.PRODUCTION_DATABASE_URL = 'mongodb://prod:pass@host:port/prod_db';
      process.env.PRODUCTION_LOG_LEVEL = 'warn';

      const config = loadConfig();
      expect(config.environment).toBe('production');
      expect(config.apiEndpoint).toBe('https://prod.api.com');
      expect(config.port).toBe(8081);
      expect(config.databaseUrl).toBe('mongodb://prod:pass@host:port/prod_db');
      expect(config.logLevel).toBe('warn');
    });

    it('should load staging configuration when NODE_ENV is set to staging', () => {
      process.env.NODE_ENV = 'staging';
      process.env.STAGING_API_ENDPOINT = 'https://staging.api.com';
      process.env.STAGING_PORT = '8082';
      process.env.STAGING_DATABASE_URL = 'mongodb://staging:pass@host:port/staging_db';
      process.env.STAGING_LOG_LEVEL = 'error';

      const config = loadConfig();
      expect(config.environment).toBe('staging');
      expect(config.apiEndpoint).toBe('https://staging.api.com');
      expect(config.port).toBe(8082);
      expect(config.databaseUrl).toBe('mongodb://staging:pass@host:port/staging_db');
      expect(config.logLevel).toBe('error');
    });

    it('should use default production values when specific production environment variables are not set', () => {
      process.env.NODE_ENV = 'production';
      const config = loadConfig();
      expect(config.apiEndpoint).toBe('https://api.example.com');
      expect(config.port).toBe(8080);
      expect(config.databaseUrl).toBe('mongodb://user:pass@host:port/db');
      expect(config.logLevel).toBe('info');
    });

    it('should use default staging values when specific staging environment variables are not set', () => {
      process.env.NODE_ENV = 'staging';
      const config = loadConfig();
      expect(config.apiEndpoint).toBe('https://staging.api.example.com');
      expect(config.port).toBe(8081);
      expect(config.databaseUrl).toBe('mongodb://user:pass@host:port/staging_db');
      expect(config.logLevel).toBe('info');
    });

    it('should use default development values when specific development environment variables are not set', () => {
      process.env.NODE_ENV = 'development';
      const config = loadConfig();
      expect(config.apiEndpoint).toBe('http://localhost:3000');
      expect(config.port).toBe(3000);
      expect(config.databaseUrl).toBe('mongodb://localhost:27017/dev_db');
      expect(config.logLevel).toBe('debug');
    });

    it('should throw an error when the port is not a number', () => {
      process.env.NODE_ENV = 'production';
      process.env.PRODUCTION_PORT = 'not a number';

      expect(() => loadConfig()).toThrowError('Invalid port number.  Please check your environment variables.');
    });

    it('should handle additional configuration options', () => {
      process.env.NODE_ENV = 'development';
      process.env.ADDITIONAL_CONFIG = 'some value';

      const config = loadConfig();
      expect(config.environment).toBe('development');
      expect((config as any).ADDITIONAL_CONFIG).toBeUndefined(); // Additional properties are not directly added to the config object
    });

    it('should re-throw the error after logging it', () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();

      process.env.NODE_ENV = 'production';
      process.env.PRODUCTION_PORT = 'not a number';

      expect(() => loadConfig()).toThrowError('Invalid port number.  Please check your environment variables.');
      expect(console.error).toHaveBeenCalled();

      console.error = originalConsoleError;
    });
  });

  describe('Default Export (config object)', () => {
    it('should export a config object with default values', () => {
      const defaultConfig = config;
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.environment).toBeDefined();
      expect(defaultConfig.apiEndpoint).toBeDefined();
      expect(defaultConfig.port).toBeDefined();
      expect(defaultConfig.databaseUrl).toBeDefined();
      expect(defaultConfig.logLevel).toBeDefined();
    });
  });
});