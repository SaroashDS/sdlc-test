import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef {Object} DataFetchingResult
 * @property {any} data - The fetched data.  Initially null.
 * @property {boolean} isLoading - Indicates if the data is currently being fetched.
 * @property {Error | null} error - An error object if an error occurred during fetching, otherwise null.
 * @property {() => Promise<void>} fetchData - A function to manually trigger data fetching.  Useful for refetching.
 */

/**
 * Custom hook for data fetching with error handling and loading states.
 *
 * @template T - The type of the data being fetched.
 * @param {string} url - The URL to fetch data from.
 * @param {object} [options] - Optional fetch options.
 * @returns {DataFetchingResult} An object containing the data, loading state, error, and a function to refetch the data.
 */
function useDataFetching<T>(url: string, options?: RequestInit): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const jsonData: T = await response.json();
      setData(jsonData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error("An unexpected error occurred."));
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, fetchData };
}

export default useDataFetching;