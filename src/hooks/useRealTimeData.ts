import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef RealtimeDataResult
 * @property {any} data - The latest data received from the real-time source.
 * @property {boolean} isLoading - Indicates whether the data is currently being loaded.
 * @property {Error | null} error - An error object if an error occurred during data fetching, otherwise null.
 * @property {() => void} refresh - A function to manually trigger a data refresh.
 */

/**
 * A custom React hook for fetching and managing real-time data.
 *
 * @param {() => Promise<any>} fetchData - A function that fetches the data.  Should return a promise that resolves with the data.
 * @param {number} interval - The interval (in milliseconds) at which to fetch data.
 * @returns {RealtimeDataResult} An object containing the data, loading state, error, and refresh function.
 */
const useRealtimeData = (
  fetchData: () => Promise<any>,
  interval: number
): {
  data: any;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
} => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDataAndUpdateState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchDataAndUpdateState();

    const intervalId = setInterval(() => {
      fetchDataAndUpdateState();
    }, interval);

    return () => clearInterval(intervalId);
  }, [fetchDataAndUpdateState, interval]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDataAndUpdateState,
  };
};

export default useRealtimeData;