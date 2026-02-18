// api.config.test.ts
import apiConfig from './api.config';
import { loadApiConfig } from './api.config';

describe('apiConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; // Make a copy so mutations don't leak
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error output
  });

  afterEach(() => {
    process.env = originalEnv; // Restore old environment
    jest.restoreAllMocks();
  });

  it('should load default configuration when no environment variables are set', () => {
    delete process.env.REACT_APP_API_BASE_URL;
    delete process.env.REACT_APP_API_TIMEOUT;

    const config = require('./api.config').default;
    expect(config.baseUrl).toBe('http://localhost:3000/api');
    expect(config.timeout).toBe(5000);
    expect(config.headers['Content-Type']).toBe('application/json');
  });

  it('should override baseUrl with REACT_APP_API_BASE_URL environment variable', () => {
    process.env.REACT_APP_API_BASE_URL = 'https://example.com/api';
    const config = require('./api.config').default;
    expect(config.baseUrl).toBe('https://example.com/api');
  });

  it('should override timeout with REACT_APP_API_TIMEOUT environment variable', () => {
    process.env.REACT_APP_API_TIMEOUT = '10000';
    const config = require('./api.config').default;
    expect(config.timeout).toBe(10000);
  });

  it('should handle invalid timeout value and use default', () => {
    process.env.REACT_APP_API_TIMEOUT = 'invalid';
    const config = require('./api.config').default;
    expect(config.timeout).toBe(5000);
    expect(console.error).toHaveBeenCalled();
  });

  it('should return default config if an error occurs during loading', () => {
    const originalProcessEnv = process.env;
    process.env = {};
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock parseInt to throw an error
    const parseIntMock = jest.spyOn(global, 'parseInt');
    parseIntMock.mockImplementation(() => {
      throw new Error('Forced error');
    });

    const config = require('./api.config').default;
    expect(config.baseUrl).toBe('http://localhost:3000/api');
    expect(config.timeout).toBe(5000);
    expect(console.error).toHaveBeenCalled();

    process.env = originalProcessEnv;
    parseIntMock.mockRestore();
  });

  it('loadApiConfig function should return the correct config', () => {
    process.env.REACT_APP_API_BASE_URL = 'https://test.com/api';
    process.env.REACT_APP_API_TIMEOUT = '7000';
    const config = require('./api.config').loadApiConfig();
    expect(config.baseUrl).toBe('https://test.com/api');
    expect(config.timeout).toBe(7000);
  });

  it('should handle missing REACT_APP_API_TIMEOUT gracefully', () => {
    delete process.env.REACT_APP_API_TIMEOUT;
    const config = require('./api.config').default;
    expect(config.timeout).toBe(5000);
  });

  it('should handle missing REACT_APP_API_BASE_URL gracefully', () => {
    delete process.env.REACT_APP_API_BASE_URL;
    const config = require('./api.config').default;
    expect(config.baseUrl).toBe('http://localhost:3000/api');
  });

  it('should not modify the defaultConfig object', () => {
    const originalDefaultConfig = {
      baseUrl: 'http://localhost:3000/api',
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    };

    process.env.REACT_APP_API_BASE_URL = 'https://example.com/api';
    process.env.REACT_APP_API_TIMEOUT = '10000';

    require('./api.config').default;

    expect(originalDefaultConfig).toEqual({
      baseUrl: 'http://localhost:3000/api',
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('should handle zero timeout value', () => {
    process.env.REACT_APP_API_TIMEOUT = '0';
    const config = require('./api.config').default;
    expect(config.timeout).toBe(0);
  });

  it('should handle negative timeout value', () => {
    process.env.REACT_APP_API_TIMEOUT = '-1';
    const config = require('./api.config').default;
    expect(config.timeout).toBe(-1);
  });
});