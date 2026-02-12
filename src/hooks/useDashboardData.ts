import { useState, useEffect, useCallback } from 'react';

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  newOrders: number;
  revenue: number;
}

interface DashboardDataState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

/**
 * Custom React hook for fetching and managing dashboard data.
 *
 * @returns {DashboardDataState} An object containing the dashboard data, loading state, error state, and a function to refresh the data.
 */
const useDashboardData = (): DashboardDataState => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate fetching data from an API
      const response = await fetch('/api/dashboard'); // Replace with your actual API endpoint
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData: DashboardData = await response.json();
      setData(jsonData);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refreshData: fetchData,
  };
};

export default useDashboardData;