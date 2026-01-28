import { renderHook, act } from '@testing-library/react-hooks';
import useRealtimeData from './useRealtimeData';

describe('useRealtimeData', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should return the correct initial state', () => {
    const fetchData = jest.fn(() => Promise.resolve({ value: 'initial' }));
    const { result } = renderHook(() => useRealtimeData(fetchData, 1000));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch data on mount and update state', async () => {
    const fetchData = jest.fn(() => Promise.resolve({ value: 'data' }));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 1000));

    await waitForNextUpdate();

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ value: 'data' });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch data at the specified interval', async () => {
    const fetchData = jest.fn(() => Promise.resolve({ value: 'data' }));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 1000));

    await waitForNextUpdate();
    expect(fetchData).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitForNextUpdate();
    expect(fetchData).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ value: 'data' });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors during data fetching', async () => {
    const fetchData = jest.fn(() => Promise.reject(new Error('Failed to fetch data')));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 1000));

    await waitForNextUpdate();

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(new Error('Failed to fetch data'));
  });

  it('should allow manual refresh of data', async () => {
    const fetchData = jest.fn(() => Promise.resolve({ value: 'data' }));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 1000));

    await waitForNextUpdate();
    expect(fetchData).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });

    await waitForNextUpdate();
    expect(fetchData).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ value: 'data' });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should clear the interval on unmount', () => {
    const fetchData = jest.fn(() => Promise.resolve({ value: 'data' }));
    const { unmount } = renderHook(() => useRealtimeData(fetchData, 1000));

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle fetchData returning null', async () => {
    const fetchData = jest.fn(() => Promise.resolve(null));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 1000));

    await waitForNextUpdate();

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetchData returning undefined', async () => {
    const fetchData = jest.fn(() => Promise.resolve(undefined));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 1000));

    await waitForNextUpdate();

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle zero interval', async () => {
    const fetchData = jest.fn(() => Promise.resolve({ value: 'data' }));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 0));

    await waitForNextUpdate();

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ value: 'data' });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should not call fetchData again because interval is 0
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should handle negative interval (treated as 0)', async () => {
    const fetchData = jest.fn(() => Promise.resolve({ value: 'data' }));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, -1000));

    await waitForNextUpdate();

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ value: 'data' });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should not call fetchData again because interval is 0
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should handle fetchData throwing a string error', async () => {
    const fetchData = jest.fn(() => Promise.reject('Failed to fetch data'));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 1000));

    await waitForNextUpdate();

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual('Failed to fetch data');
  });

  it('should handle fetchData throwing an object error', async () => {
    const errorObject = { message: 'Failed to fetch data' };
    const fetchData = jest.fn(() => Promise.reject(errorObject));
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeData(fetchData, 1000));

    await waitForNextUpdate();

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(errorObject);
  });
});