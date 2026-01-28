// dashboardService.ts

/**
 * @module dashboardService
 * @description Functions for fetching dashboard-specific data (KPIs, charts).
 */

// ============================================================================
// Interfaces & Types
// ============================================================================

/**
 * Represents a single Key Performance Indicator (KPI).
 */
export interface Kpi {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'stable';
}

/**
 * Represents a single data point in a chart.
 */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/**
 * Represents the complete data structure for a chart.
 */
export interface ChartData {
  title: string;
  dataPoints: ChartDataPoint[];
}

/**
 * Represents a single item in a recent activity feed.
 */
export interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
  action: string;
  timestamp: string; // ISO 8601 date string
}

/**
 * Defines a date range for filtering data.
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// Custom Error
// ============================================================================

/**
 * Custom error class for service-specific issues.
 */
export class DashboardServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DashboardServiceError';
  }
}

// ============================================================================
// Service Class
// ============================================================================

/**
 * Service class for handling dashboard data fetching.
 * This class encapsulates all logic for communicating with the dashboard API endpoints.
 */
class DashboardService {
  private readonly apiBaseUrl: string;

  /**
   * @constructor
   * @param {string} [apiBaseUrl] - The base URL for the API. Defaults to a mock API.
   */
  constructor(apiBaseUrl: string = '/api/dashboard') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * A private helper to simulate fetching data from an API.
   * In a real application, this would use fetch, axios, or another HTTP client.
   * @private
   * @template T
   * @param {string} endpoint - The API endpoint to fetch from.
   * @param {RequestInit} [options] - Optional request options.
   * @returns {Promise<T>} - A promise that resolves with the fetched data.
   * @throws {DashboardServiceError} - Throws if the network request fails.
   */
  private async _fetchData<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      // In a real-world scenario, you would use fetch:
      // const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);
      // if (!response.ok) {
      //   throw new Error(`API error: ${response.status} ${response.statusText}`);
      // }
      // return await response.json() as T;

      // For demonstration, we simulate a network delay and return mock data.
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Simulating fetch for: ${this.apiBaseUrl}${endpoint}`);
      
      // Mock responses based on endpoint
      if (endpoint.startsWith('/kpis')) {
        return [
          { id: 'revenue', title: 'Total Revenue', value: '$45,231.89', change: '+20.1%', changeType: 'increase' },
          { id: 'subscriptions', title: 'Subscriptions', value: '+2350', change: '+180.1%', changeType: 'increase' },
          { id: 'sales', title: 'Sales', value: '+12,234', change: '+19%', changeType: 'increase' },
          { id: 'active_now', title: 'Active Now', value: '+573', change: '-2.1%', changeType: 'decrease' },
        ] as unknown as T;
      }
      if (endpoint.startsWith('/sales-chart')) {
        return {
          title: 'Sales Overview',
          dataPoints: [
            { label: 'Jan', value: 4000 }, { label: 'Feb', value: 3000 },
            { label: 'Mar', value: 2000 }, { label: 'Apr', value: 2780 },
            { label: 'May', value: 1890 }, { label: 'Jun', value: 2390 },
            { label: 'Jul', value: 3490 }, { label: 'Aug', value: 4100 },
            { label: 'Sep', value: 3200 }, { label: 'Oct', value: 5000 },
            { label: 'Nov', value: 4500 }, { label: 'Dec', value: 4800 },
          ],
        } as unknown as T;
      }
      if (endpoint.startsWith('/recent-activity')) {
        return [
          { id: 'act1', user: { name: 'Olivia Martin' }, action: 'purchased "Pro Plan".', timestamp: new Date().toISOString() },
          { id: 'act2', user: { name: 'Jackson Lee' }, action: 'updated their profile.', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 'act3', user: { name: 'Isabella Nguyen' }, action: 'cancelled their subscription.', timestamp: new Date(Date.now() - 7200000).toISOString() },
        ] as unknown as T;
      }

      throw new Error('Unknown endpoint');

    } catch (error) {
      // Catch network errors or non-ok responses and wrap them in a service-specific error.
      throw new DashboardServiceError(`Failed to fetch data from endpoint: ${endpoint}`, error);
    }
  }

  /**
   * Fetches the main Key Performance Indicators (KPIs) for the dashboard.
   * @returns {Promise<Kpi[]>} A promise that resolves to an array of KPI objects.
   * @throws {DashboardServiceError} If the API call fails.
   */
  public async getKpis(): Promise<Kpi[]> {
    try {
      const kpis = await this._fetchData<Kpi[]>('/kpis');
      return kpis;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      // Re-throw the original service error to be handled by the caller.
      throw error;
    }
  }

  /**
   * Fetches data for the sales chart within a specific date range.
   * @param {DateRange} dateRange - The start and end dates for the chart data.
   * @returns {Promise<ChartData>} A promise that resolves to a chart data object.
   * @throws {DashboardServiceError} If the API call fails.
   */
  public async getSalesChartData(dateRange: DateRange): Promise<ChartData> {
    try {
      const queryParams = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });
      const chartData = await this._fetchData<ChartData>(`/sales-chart?${queryParams}`);
      return chartData;
    } catch (error) {
      console.error('Error fetching sales chart data:', error);
      throw error;
    }
  }

  /**
   * Fetches the most recent activity items.
   * @param {number} [limit=5] - The maximum number of activity items to fetch.
   * @returns {Promise<ActivityItem[]>} A promise that resolves to an array of activity items.
   * @throws {DashboardServiceError} If the API call fails.
   */
  public async getRecentActivity(limit: number = 5): Promise<ActivityItem[]> {
    try {
      const activity = await this._fetchData<ActivityItem[]>(`/recent-activity?limit=${limit}`);
      return activity;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

/**
 * A singleton instance of the DashboardService.
 * This is a common pattern for services that do not need to maintain state
 * specific to multiple instances.
 */
export const dashboardService = new DashboardService();