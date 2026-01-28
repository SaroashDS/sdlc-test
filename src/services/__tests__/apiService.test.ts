import ApiService from '../src/apiService';

describe('ApiService', () => {
  const baseUrl = 'https://example.com/api';
  let apiService: ApiService;
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    apiService = new ApiService(baseUrl);
    mockFetch = jest.spyOn(global, 'fetch') as jest.SpyInstance;
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleResponse', () => {
    it('should return data on successful response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ message: 'Success' }),
      } as any;

      const result = await (apiService as any).handleResponse(mockResponse);

      expect(result).toEqual({ data: { message: 'Success' }, error: null, status: 200 });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return error on unsuccessful response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ message: 'Bad Request' }),
      } as any;

      const result = await (apiService as any).handleResponse(mockResponse);

      expect(result).toEqual({ data: null, error: 'Bad Request', status: 400 });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return generic error on json parsing failure', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('JSON parsing error')),
      } as any;

      const result = await (apiService as any).handleResponse(mockResponse);

      expect(result).toEqual({ data: null, error: 'An unexpected error occurred', status: 500 });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return generic error on unexpected error', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      } as any;

      const result = await (apiService as any).handleResponse(mockResponse);

      expect(result).toEqual({ data: null, error: 'Unexpected error', status: 500 });
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should make a GET request and return data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ message: 'GET Success' }),
      });

      const result = await apiService.get<{ message: string }>('test');

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, { method: 'GET', headers: undefined });
      expect(result).toEqual({ data: { message: 'GET Success' }, error: null, status: 200 });
    });

    it('should make a GET request with custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ message: 'GET Success' }),
      });

      const headers = { 'X-Custom-Header': 'value' };
      const result = await apiService.get<{ message: string }>('test', headers);

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, { method: 'GET', headers: headers });
      expect(result).toEqual({ data: { message: 'GET Success' }, error: null, status: 200 });
    });

    it('should return error on GET request failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await apiService.get<{ message: string }>('test');

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, { method: 'GET', headers: undefined });
      expect(result).toEqual({ data: null, error: 'Network error', status: 500 });
    });
  });

  describe('post', () => {
    it('should make a POST request and return data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ message: 'POST Success' }),
      });

      const body = { key: 'value' };
      const result = await apiService.post<{ message: string }>('test', body);

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ data: { message: 'POST Success' }, error: null, status: 201 });
    });

    it('should make a POST request with custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ message: 'POST Success' }),
      });

      const body = { key: 'value' };
      const headers = { 'X-Custom-Header': 'value' };
      const result = await apiService.post<{ message: string }>('test', body, headers);

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ data: { message: 'POST Success' }, error: null, status: 201 });
    });

    it('should return error on POST request failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const body = { key: 'value' };
      const result = await apiService.post<{ message: string }>('test', body);

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ data: null, error: 'Network error', status: 500 });
    });
  });

  describe('put', () => {
    it('should make a PUT request and return data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ message: 'PUT Success' }),
      });

      const body = { key: 'value' };
      const result = await apiService.put<{ message: string }>('test', body);

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ data: { message: 'PUT Success' }, error: null, status: 200 });
    });

    it('should return error on PUT request failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const body = { key: 'value' };
      const result = await apiService.put<{ message: string }>('test', body);

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ data: null, error: 'Network error', status: 500 });
    });
  });

  describe('delete', () => {
    it('should make a DELETE request and return data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ message: 'DELETE Success' }),
      });

      const result = await apiService.delete<{ message: string }>('test');

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, { method: 'DELETE', headers: undefined });
      expect(result).toEqual({ data: { message: 'DELETE Success' }, error: null, status: 200 });
    });

    it('should return error on DELETE request failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await apiService.delete<{ message: string }>('test');

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, { method: 'DELETE', headers: undefined });
      expect(result).toEqual({ data: null, error: 'Network error', status: 500 });
    });
  });

  describe('patch', () => {
    it('should make a PATCH request and return data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ message: 'PATCH Success' }),
      });

      const body = { key: 'value' };
      const result = await apiService.patch<{ message: string }>('test', body);

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ data: { message: 'PATCH Success' }, error: null, status: 200 });
    });

    it('should return error on PATCH request failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const body = { key: 'value' };
      const result = await apiService.patch<{ message: string }>('test', body);

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ data: null, error: 'Network error', status: 500 });
    });
  });
});