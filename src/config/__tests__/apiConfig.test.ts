// apiConfig.test.ts
import { getApiConfig, constructApiUrl } from './apiConfig';

describe('apiConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Important - it clears the cache
    process.env = { ...originalEnv }; // Copy original env vars
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original env vars
  });

  describe('getApiConfig', () => {
    it('should return the default API configuration when REACT_APP_API_BASE_URL is not set', () => {
      delete process.env.REACT_APP_API_BASE_URL;
      const config = getApiConfig();
      expect(config.baseUrl).toBe('http://localhost:3000');
      expect(config.timeout).toBe(5000);
      expect(config.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should return the API configuration with REACT_APP_API_BASE_URL from environment variables', () => {
      process.env.REACT_APP_API_BASE_URL = 'https://test.example.com';
      const config = getApiConfig();
      expect(config.baseUrl).toBe('https://test.example.com');
      expect(config.timeout).toBe(5000);
      expect(config.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should throw an error if baseUrl is empty', () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();
      process.env.REACT_APP_API_BASE_URL = '';
      jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => getApiConfig()).toThrowError('API base URL is not configured.');
      console.error = originalConsoleError;
    });
  });

  describe('constructApiUrl', () => {
    it('should construct a full API URL with the default base URL', () => {
      delete process.env.REACT_APP_API_BASE_URL;
      const url = constructApiUrl('users');
      expect(url).toBe('http://localhost:3000/users');
    });

    it('should construct a full API URL with the base URL from environment variables', () => {
      process.env.REACT_APP_API_BASE_URL = 'https://test.example.com';
      const url = constructApiUrl('products');
      expect(url).toBe('https://test.example.com/products');
    });

    it('should handle endpoints with leading slashes correctly', () => {
      process.env.REACT_APP_API_BASE_URL = 'https://test.example.com';
      const url = constructApiUrl('/items');
      expect(url).toBe('https://test.example.com//items');
    });

    it('should handle endpoints with no slashes correctly', () => {
      process.env.REACT_APP_API_BASE_URL = 'https://test.example.com';
      const url = constructApiUrl('items');
      expect(url).toBe('https://test.example.com/items');
    });
  });
});