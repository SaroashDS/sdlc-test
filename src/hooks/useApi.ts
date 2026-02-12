import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * A generic custom hook for handling API requests.
 * It manages loading, error, and data states for an asynchronous operation.
 *
 * @template T The expected type of the data returned by the API call.
 * @template P The type of the arguments array for the API function.
 * @param {(...args: P) => Promise<T>} apiFunc The asynchronous function that performs the API request.
 * @returns {{
 *   data: T | null;
 *   error: Error | null;
 *   loading: boolean;
 *   request: (...args: P) => Promise<void>;
 * }} An object containing the current state of the request (data, error, loading)
 *    and a function to trigger the request.
 */
export const useApi = <T, P extends any[]>(
  apiFunc: (...args: P) => Promise<T>
) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * A ref to track whether the component is still mounted.
   * This helps prevent state updates on an unmounted component, which can cause memory leaks.
   */
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * A memoized function that wraps the apiFunc to handle state changes.
   * It sets the loading state, executes the API call, and then updates
   * either the data or error state based on the result.
   */
  const request = useCallback(
    async (...args: P) => {
      if (!isMounted.current) {
        return;
      }

      setLoading(true);
      setError(null);
      // Optionally, you might want to clear previous data:
      // setData(null);

      try {
        const response = await apiFunc(...args);
        if (isMounted.current) {
          setData(response);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [apiFunc] // Dependency array ensures the callback is updated if apiFunc changes.
  );

  return {
    data,
    error,
    loading,
    request,
  };
};