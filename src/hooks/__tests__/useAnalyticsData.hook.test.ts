import { renderHook, act } from '@testing-library/react-hooks';
import useAnalyticsData from './useAnalyticsData.hook';

const mockAnalyticsData = {
  pageViews: 1000,
  uniqueVisitors: 500,
};

describe('useAnalyticsData Hook', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the correct initial state', () => {
    const { result } = renderHook(() => useAnalyticsData('test-url'));

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch analytics data successfully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockAnalyticsData),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(mockAnalyticsData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('test-url');
  });

  it('should handle fetch errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('HTTP error! Status: 500');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('test-url');
  });

  it('should handle network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('test-url');
  });

  it('should allow manual refetching of data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockAnalyticsData),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(mockAnalyticsData);

    const newAnalyticsData = { pageViews: 2000, uniqueVisitors: 1000 };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(newAnalyticsData),
    });

    act(() => {
      result.current.fetchAnalyticsData();
    });

    await waitForNextUpdate();

    expect(result.current.analyticsData).toEqual(newAnalyticsData);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle empty API URL', async () => {
    const { result } = renderHook(() => useAnalyticsData(''));

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(true);

    // Mock fetch to resolve immediately to prevent unhandled promise rejection
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    }) as jest.Mock;

    // Wait for the loading state to change
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(false);
  });

  it('should handle API returning null data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(null),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle API returning undefined data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(undefined),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle API returning a non-JSON response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('Unexpected token < in JSON at position 0')),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useAnalyticsData('test-url'));

    await waitForNextUpdate();

    expect(result.current.analyticsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle different API URLs', async () => {
    const apiUrl1 = 'url1';
    const apiUrl2 = 'url2';

    const mockData1 = { data: 'data1' };
    const mockData2 = { data: 'data2' };

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockData1) })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockData2) })
      );

    const { result: result1, waitForNextUpdate: waitForNextUpdate1 } = renderHook(() =>
      useAnalyticsData(apiUrl1)
    );
    await waitForNextUpdate1();
    expect(result1.current.analyticsData).toEqual(mockData1);
    expect(fetch).toHaveBeenCalledWith(apiUrl1);

    const { result: result2, waitForNextUpdate: waitForNextUpdate2 } = renderHook(() =>
      useAnalyticsData(apiUrl2)
    );
    await waitForNextUpdate2();
    expect(result2.current.analyticsData).toEqual(mockData2);
    expect(fetch).toHaveBeenCalledWith(apiUrl2);
  });

  it('should not call fetch if the component is unmounted', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockAnalyticsData),
    });
    global.fetch = fetchMock;

    const { result, unmount } = renderHook(() => useAnalyticsData('test-url'));

    unmount();

    // Wait a short time to see if fetch is called after unmount
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1); // It's called once during initial render
  });
});