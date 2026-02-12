import { renderHook, act } from '@testing-library/react-hooks';
import { useRealTimeUpdates, UseRealTimeUpdatesOptions } from './useRealTimeUpdates';

// Helper to create a promise that can be resolved/rejected externally
const createControllablePromise = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
};

describe('useRealTimeUpdates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should return the correct initial state', () => {
    const fetcher = jest.fn().mockResolvedValue('initial data');
    const { result } = renderHook(() => useRealTimeUpdates({ fetcher }));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true); // Initial fetch starts immediately
    expect(result.current.isPolling).toBe(false);
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should not fetch initially if enabled is false', () => {
    const fetcher = jest.fn();
    const { result } = renderHook(() => useRealTimeUpdates({ fetcher, enabled: false }));

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPolling).toBe(false);
  });

  it('should perform an initial fetch and update state on success', async () => {
    const mockData = { id: 1, value: 'test' };
    const fetcher = jest.fn().mockResolvedValue(mockData);
    const onSuccess = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useRealTimeUpdates({ fetcher, onSuccess })
    );

    expect(result.current.isLoading).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(mockData);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch errors and update state accordingly', async () => {
    const mockError = new Error('Fetch failed');
    const fetcher = jest.fn().mockRejectedValue(mockError);
    const onError = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useRealTimeUpdates({ fetcher, onError })
    );

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(mockError);
    expect(onError).toHaveBeenCalledWith(mockError);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('should manually refetch data when refetch is called', async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce('first call')
      .mockResolvedValueOnce('second call');
    const { result, waitForNextUpdate } = renderHook(() => useRealTimeUpdates({ fetcher }));

    // Wait for initial fetch
    await waitForNextUpdate();
    expect(result.current.data).toBe('first call');
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Manually trigger refetch
    act(() => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);

    // Wait for refetch to complete
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('second call');
  });

  it('should prevent concurrent fetches', async () => {
    const { promise, resolve } = createControllablePromise<string>();
    const fetcher = jest.fn().mockReturnValue(promise);
    const { result } = renderHook(() => useRealTimeUpdates({ fetcher }));

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);

    // Try to refetch while the first fetch is in progress
    act(() => {
      result.current.refetch();
      result.current.refetch();
    });

    // Fetcher should not be called again
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Resolve the initial promise
    await act(async () => {
      resolve('data');
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('data');
  });

  describe('Polling', () => {
    it('should start polling if interval is provided', async () => {
      const fetcher = jest.fn()
        .mockResolvedValueOnce('data 1')
        .mockResolvedValueOnce('data 2')
        .mockResolvedValueOnce('data 3');
      const interval = 5000;

      const { result, waitForNextUpdate } = renderHook(() =>
        useRealTimeUpdates({ fetcher, interval })
      );

      expect(result.current.isPolling).toBe(true);

      // Initial fetch
      await waitForNextUpdate();
      expect(result.current.data).toBe('data 1');
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Advance time for the first poll
      await act(async () => {
        jest.advanceTimersByTime(interval);
      });
      await waitForNextUpdate();
      expect(result.current.data).toBe('data 2');
      expect(fetcher).toHaveBeenCalledTimes(2);

      // Advance time for the second poll
      await act(async () => {
        jest.advanceTimersByTime(interval);
      });
      await waitForNextUpdate();
      expect(result.current.data).toBe('data 3');
      expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('should not poll if interval is 0 or not provided', async () => {
      const fetcher = jest.fn().mockResolvedValue('data');
      const { waitForNextUpdate } = renderHook(() => useRealTimeUpdates({ fetcher, interval: 0 }));

      await waitForNextUpdate();
      expect(fetcher).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should stop polling on unmount', async () => {
      const fetcher = jest.fn().mockResolvedValue('data');
      const interval = 5000;
      const { unmount, waitForNextUpdate } = renderHook(() =>
        useRealTimeUpdates({ fetcher, interval })
      );

      await waitForNextUpdate();
      expect(fetcher).toHaveBeenCalledTimes(1);

      unmount();

      act(() => {
        jest.advanceTimersByTime(interval * 2);
      });

      // Fetcher should not have been called again after unmount
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should stop polling when enabled becomes false', async () => {
        const fetcher = jest.fn().mockResolvedValue('data');
        const interval = 5000;
        const { rerender, waitForNextUpdate, result } = renderHook<UseRealTimeUpdatesOptions<string>, unknown>(
            (props) => useRealTimeUpdates(props),
            { initialProps: { fetcher, interval, enabled: true } }
        );

        await waitForNextUpdate();
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(result.current.isPolling).toBe(true);

        rerender({ fetcher, interval, enabled: false });
        expect(result.current.isPolling).toBe(false);

        act(() => {
            jest.advanceTimersByTime(interval * 2);
        });

        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should start fetching and polling when enabled becomes true', async () => {
        const fetcher = jest.fn().mockResolvedValue('data');
        const interval = 5000;
        const { rerender, waitForNextUpdate, result } = renderHook<UseRealTimeUpdatesOptions<string>, unknown>(
            (props) => useRealTimeUpdates(props),
            { initialProps: { fetcher, interval, enabled: false } }
        );

        expect(fetcher).not.toHaveBeenCalled();
        expect(result.current.isPolling).toBe(false);

        rerender({ fetcher, interval, enabled: true });

        await waitForNextUpdate();
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(result.current.isPolling).toBe(true);

        await act(async () => {
            jest.advanceTimersByTime(interval);
        });

        await waitForNextUpdate();
        expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  it('should use the latest callbacks without re-triggering effects', async () => {
    const fetcher = jest.fn().mockResolvedValue('data');
    const initialOnSuccess = jest.fn();
    const updatedOnSuccess = jest.fn();

    const { rerender, waitForNextUpdate } = renderHook(
      ({ onSuccess }) => useRealTimeUpdates({ fetcher, onSuccess }),
      { initialProps: { onSuccess: initialOnSuccess } }
    );

    await waitForNextUpdate();
    expect(initialOnSuccess).toHaveBeenCalledTimes(1);
    expect(updatedOnSuccess).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Rerender with a new onSuccess callback
    rerender({ onSuccess: updatedOnSuccess });

    // Manually refetch to trigger the callback
    act(() => {
      result.current.refetch();
    });
    await waitForNextUpdate();

    // The effect should not have re-run, but the new callback should be used
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(initialOnSuccess).toHaveBeenCalledTimes(1);
    expect(updatedOnSuccess).toHaveBeenCalledTimes(1);
    expect(updatedOnSuccess).toHaveBeenCalledWith('data');
  });

  it('should retain previous data on a subsequent fetch error', async () => {
    const mockError = new Error('Fetch failed');
    const fetcher = jest.fn()
      .mockResolvedValueOnce('good data')
      .mockRejectedValueOnce(mockError);
    const onError = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useRealTimeUpdates({ fetcher, onError })
    );

    // Wait for initial successful fetch
    await waitForNextUpdate();
    expect(result.current.data).toBe('good data');
    expect(result.current.error).toBeNull();

    // Trigger a refetch that will fail
    act(() => {
      result.current.refetch();
    });
    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('good data'); // Data is preserved
    expect(result.current.error).toEqual(mockError);
    expect(onError).toHaveBeenCalledWith(mockError);
  });
});