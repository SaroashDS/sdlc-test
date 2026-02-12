import { renderHook, act } from '@testing-library/react-hooks';
import { useApi } from './useApi'; // Adjust the import path as needed

/**
 * Helper to create a promise that can be resolved/rejected externally.
 * This is useful for testing scenarios where you need to control the timing
 * of an asynchronous operation, like testing unmount behavior.
 */
const createControllablePromise = <T>() => {
  let resolvePromise: (value: T | PromiseLike<T>) => void;
  let rejectPromise: (reason?: any) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  // The '!' asserts that the callbacks will be assigned by the Promise constructor.
  return { promise, resolve: resolvePromise!, reject: rejectPromise! };
};

describe('useApi', () => {
  // Test Case 1: Initial State
  test('should return the initial state correctly', () => {
    const mockApiFunc = jest.fn();
    const { result } = renderHook(() => useApi(mockApiFunc));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.request).toBe('function');
  });

  // Test Case 2: Successful API Request
  test('should handle a successful API request and update state accordingly', async () => {
    const mockData = { id: 1, name: 'Test Data' };
    const mockApiFunc = jest.fn().mockResolvedValue(mockData);
    const { result, waitForNextUpdate } = renderHook(() => useApi(mockApiFunc));

    // Trigger the request
    act(() => {
      result.current.request();
    });

    // Check loading state immediately after request
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for the promise to resolve and state to update
    await waitForNextUpdate();

    // Check final state
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockApiFunc).toHaveBeenCalledTimes(1);
  });

  // Test Case 3: Failed API Request
  test('should handle a failed API request and update the error state', async () => {
    const mockError = new Error('Network Error');
    const mockApiFunc = jest.fn().mockRejectedValue(mockError);
    const { result, waitForNextUpdate } = renderHook(() => useApi(mockApiFunc));

    act(() => {
      result.current.request();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(mockError);
    expect(mockApiFunc).toHaveBeenCalledTimes(1);
  });

  // Test Case 4: Request with Arguments
  test('should call the apiFunc with the correct arguments', async () => {
    const mockApiFunc = jest.fn().mockResolvedValue('Success');
    const { result, waitForNextUpdate } = renderHook(() => useApi(mockApiFunc));

    const args = [123, 'test-arg', { active: true }];
    act(() => {
      result.current.request(...args);
    });

    await waitForNextUpdate();

    expect(mockApiFunc).toHaveBeenCalledWith(...args);
  });

  // Test Case 5: Cleanup on Unmount
  test('should not update state if the component is unmounted during the request', async () => {
    const { promise, resolve } = createControllablePromise<string>();
    const mockApiFunc = jest.fn().mockReturnValue(promise);
    const { result, unmount } = renderHook(() => useApi(mockApiFunc));

    act(() => {
      result.current.request();
    });

    // State is now loading
    expect(result.current.loading).toBe(true);

    // Unmount the component before the promise resolves
    unmount();

    // Resolve the promise after unmount
    await act(async () => {
      resolve('Some data that should be ignored');
    });

    // State should not have changed because the component is unmounted
    expect(result.current.loading).toBe(true); // It was true on unmount
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // Test Case 6: Sequential Requests (Success -> Error -> Success)
  test('should correctly handle sequential requests and state transitions', async () => {
    const successData1 = { message: 'First success' };
    const errorData = new Error('Request failed');
    const successData2 = { message: 'Second success' };

    const mockApiFunc = jest.fn()
      .mockResolvedValueOnce(successData1)
      .mockRejectedValueOnce(errorData)
      .mockResolvedValueOnce(successData2);

    const { result, waitForNextUpdate } = renderHook(() => useApi(mockApiFunc));

    // --- First Request (Success) ---
    act(() => {
      result.current.request();
    });
    await waitForNextUpdate();

    expect(result.current.data).toEqual(successData1);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);

    // --- Second Request (Error) ---
    act(() => {
      result.current.request();
    });
    expect(result.current.loading).toBe(true);
    // Previous data is still present, error is cleared for the new request
    expect(result.current.data).toEqual(successData1);
    expect(result.current.error).toBeNull();

    await waitForNextUpdate();

    expect(result.current.data).toEqual(successData1); // Data from previous success remains
    expect(result.current.error).toEqual(errorData);
    expect(result.current.loading).toBe(false);

    // --- Third Request (Success) ---
    act(() => {
      result.current.request();
    });
    expect(result.current.loading).toBe(true);
    // Error is cleared on new request
    expect(result.current.error).toBeNull();

    await waitForNextUpdate();

    expect(result.current.data).toEqual(successData2); // Data is updated
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);

    expect(mockApiFunc).toHaveBeenCalledTimes(3);
  });

  // Test Case 7: Edge Case - Non-Error Rejection
  test('should create a new Error object if the rejection value is not an instance of Error', async () => {
    const rejectionValue = 'Something went wrong as a string';
    const mockApiFunc = jest.fn().mockRejectedValue(rejectionValue);
    const { result, waitForNextUpdate } = renderHook(() => useApi(mockApiFunc));

    act(() => {
      result.current.request();
    });

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('An unknown error occurred');
  });

  // Test Case 8: Edge Case - Changing apiFunc Prop
  test('should use the latest apiFunc when it changes between renders', async () => {
    const firstApiFunc = jest.fn().mockResolvedValue('first');
    const secondApiFunc = jest.fn().mockResolvedValue('second');

    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ apiFunc }) => useApi(apiFunc),
      { initialProps: { apiFunc: firstApiFunc } }
    );

    // Rerender with the new function
    rerender({ apiFunc: secondApiFunc });

    // Call request after rerender
    act(() => {
      result.current.request();
    });

    await waitForNextUpdate();

    expect(firstApiFunc).not.toHaveBeenCalled();
    expect(secondApiFunc).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('second');
  });
});