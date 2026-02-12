import { renderHook, act } from '@testing-library/react-hooks';
import useAnalyticsData from '../your-hook-file'; // Replace with the actual path
import { AnalyticsData } from '../your-hook-file'; // Replace with the actual path

// Mock the global fetch function
global.fetch = jest.fn();

describe('useAnalyticsData Hook', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should return the correct initial state', () => {
    const { result } = renderHook(() => useAnalyticsData('test-url'));

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch data and update state correctly when the API call is successful', async () => {
    const mockData: AnalyticsData = { page_views: 100, users: 50 };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    expect(result.current.loading).toBe(true); // Initial loading state

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('test-url');
  });

  it('should handle API errors and update state correctly', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('HTTP error! Status: 404');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('test-url');
  });

  it('should handle network errors and update state correctly', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('test-url');
  });

  it('should refresh data when refreshData is called', async () => {
    const mockData: AnalyticsData = { page_views: 200, users: 100 };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(mockData);

    const newMockData: AnalyticsData = { page_views: 300, users: 150 };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(newMockData),
    });

    act(() => {
      result.current.refreshData();
    });

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(newMockData);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should not call fetch if the apiUrl is an empty string', async () => {
    const { result } = renderHook(() => useAnalyticsData(''));
    // Wait a short time to ensure no fetch calls are made
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle an empty response from the API', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle a null response from the API', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle different data types in the analytics data', async () => {
    const mockData: AnalyticsData = {
      page_views: 100,
      users: 50,
      conversion_rate: 0.15,
      is_active: 1,
    };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(mockData);
  });

  it('should handle a very large number of analytics data points', async () => {
    const mockData: AnalyticsData = {};
    for (let i = 0; i < 1000; i++) {
      mockData[`metric_${i}`] = i;
    }

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(mockData);
  });

  it('should handle a URL with special characters', async () => {
    const mockData: AnalyticsData = { page_views: 100, users: 50 };
    const apiUrlWithSpecialChars = 'https://example.com/analytics?param1=value1&param2=value2#hash';
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData(apiUrlWithSpecialChars));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(apiUrlWithSpecialChars);
  });

  it('should handle a URL with unicode characters', async () => {
    const mockData: AnalyticsData = { page_views: 100, users: 50 };
    const apiUrlWithUnicode = 'https://example.com/аналитика';
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData(apiUrlWithUnicode));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(apiUrlWithUnicode);
  });
});