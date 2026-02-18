import { useState, useEffect, useCallback } from 'react';

interface AnalyticsData {
  [key: string]: any;
}

interface AnalyticsDataState {
  data: AnalyticsData | null;
  loading: boolean;
  error: Error | null;
}

interface UseAnalyticsDataResult {
  analyticsData: AnalyticsData | null;
  loading: boolean;
  error: Error | null;
  fetchAnalyticsData: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing analytics data.
 *
 * @param {string} apiUrl - The URL to fetch analytics data from.
 * @returns {UseAnalyticsDataResult} An object containing the analytics data, loading state, error state, and a function to fetch the data.
 */
const useAnalyticsData = (apiUrl: string): UseAnalyticsDataResult => {
  const [state, setState] = useState<AnalyticsDataState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchAnalyticsData = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: AnalyticsData = await response.json();
      setState({ data, loading: false, error: null });
    } catch (error: any) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    analyticsData: state.data,
    loading: state.loading,
    error: state.error,
    fetchAnalyticsData,
  };
};

export default useAnalyticsData;