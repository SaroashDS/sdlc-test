import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef DataState<T>
 * @property {boolean} loading - Indicates if the data is currently being fetched.
 * @property {T | null} data - The fetched data. Null if no data or an error occurred.
 * @property {Error | null} error - An error object if an error occurred during fetching. Null otherwise.
 */
interface DataState<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

/**
 * @typedef UseDataResult<T>
 * @property {DataState<T>} state - The current state of the data fetching process.
 * @property {() => Promise<void>} fetchData - A function to manually trigger a data fetch.
 */
interface UseDataResult<T> {
  state: DataState<T>;
  fetchData: () => Promise<void>;
}

/**
 * Custom React hook for fetching data from an API.
 *
 * @template T The type of the data being fetched.
 * @param {string} url The URL to fetch data from.
 * @param {boolean} [initialFetch=true] Whether to fetch data immediately upon mounting. Defaults to true.
 * @returns {UseDataResult<T>} An object containing the data state and a function to manually trigger a data fetch.
 */
const useData = <T>(url: string, initialFetch: boolean = true): UseDataResult<T> => {
  const [state, setState] = useState<DataState<T>>({
    loading: false,
    data: null,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: T = await response.json();
      setState({ loading: false, data: data, error: null });
    } catch (error: any) {
      setState({ loading: false, data: null, error: error });
    }
  }, [url]);

  useEffect(() => {
    if (initialFetch) {
      fetchData();
    }
  }, [fetchData, initialFetch]);

  return { state, fetchData };
};

export default useData;