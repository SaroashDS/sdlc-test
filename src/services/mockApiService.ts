/**
 * @file mockApiService.ts
 * @description A mock service to simulate fetching dashboard data, ensuring UI can be built without a live backend.
 */

// --- Interfaces for Data Structures ---

/**
 * Represents a single data point in a chart.
 */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/**
 * Represents the data for a line or bar chart.
 */
export interface ChartData {
  type: 'line' | 'bar';
  data: ChartDataPoint[];
}

/**
 * Represents a Key Performance Indicator (KPI) widget.
 */
export interface KpiWidget {
  id: string;
  type: 'kpi';
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

/**
 * Represents a chart widget.
 */
export interface ChartWidget {
  id: string;
  type: 'chart';
  title: string;
  chartData: ChartData;
}

/**
 * A union type for all possible dashboard widgets.
 */
export type Widget = KpiWidget | ChartWidget;

/**
 * Represents the overall dashboard data structure returned by the API.
 */
export interface DashboardData {
  id: string;
  title: string;
  lastUpdated: string;
  widgets: Widget[];
}

/**
 * Custom error class for API-related errors.
 * This allows consumers to catch specific API errors.
 */
export class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   * @param {string} message - The error message.
   * @param {number} status - The HTTP-like status code for the error.
   */
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Service Class ---

/**
 * A mock service to simulate fetching dashboard data.
 * This allows for UI development and testing without a live backend.
 * It simulates network latency and can be configured to throw errors for testing purposes.
 */
export class MockApiService {
  /**
   * The simulated network delay in milliseconds.
   * @private
   */
  private readonly _mockDelay: number;

  /**
   * A flag to force the service to return an error.
   * @private
   */
  private _forceError: boolean = false;

  /**
   * Creates an instance of MockApiService.
   * @param {object} [options] - Configuration options for the mock service.
   * @param {number} [options.delay=1000] - The simulated network delay in milliseconds.
   */
  constructor({ delay = 1000 }: { delay?: number } = {}) {
    this._mockDelay = delay;
  }

  /**
   * Toggles the error state for all subsequent API calls.
   * Useful for testing error handling in the UI.
   * @param {boolean} shouldForceError - If true, API calls will fail.
   */
  public setForceError(shouldForceError: boolean): void {
    this._forceError = shouldForceError;
  }

  /**
   * Simulates a network request with a configured delay and potential for error.
   * @private
   * @template T
   * @param {() => T} dataFactory - A function that returns the mock data on success.
   * @returns {Promise<T>} A promise that resolves with the mock data or rejects with an ApiError.
   */
  private _simulateNetworkRequest<T>(dataFactory: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this._forceError) {
          console.error('MockApiService: Simulating a 500 server error.');
          reject(new ApiError('Failed to fetch data from the server.', 500));
        } else {
          resolve(dataFactory());
        }
      }, this._mockDelay);
    });
  }

  /**
   * Fetches the main dashboard data.
   * @async
   * @returns {Promise<DashboardData>} A promise that resolves with the dashboard data.
   * @throws {ApiError} Throws an ApiError if the request fails (e.g., if `setForceError(true)` was called).
   */
  public async getDashboardData(): Promise<DashboardData> {
    return this._simulateNetworkRequest(() => {
      // Generate mock data on the fly to ensure it's fresh
      const mockData: DashboardData = {
        id: 'dashboard-01',
        title: 'Sales & Revenue Overview',
        lastUpdated: new Date().toISOString(),
        widgets: [
          {
            id: 'kpi-01',
            type: 'kpi',
            title: 'Total Revenue',
            value: '$45,231.89',
            trend: 'up',
            trendPercentage: 12.5,
          },
          {
            id: 'kpi-02',
            type: 'kpi',
            title: 'New Customers',
            value: '1,204',
            trend: 'up',
            trendPercentage: 5.2,
          },
          {
            id: 'kpi-03',
            type: 'kpi',
            title: 'Avg. Order Value',
            value: '$87.50',
            trend: 'down',
            trendPercentage: 1.8,
          },
          {
            id: 'chart-01',
            type: 'chart',
            title: 'Revenue Last 7 Days',
            chartData: {
              type: 'line',
              data: [
                { label: 'Mon', value: 2300 },
                { label: 'Tue', value: 2800 },
                { label: 'Wed', value: 2500 },
                { label: 'Thu', value: 3100 },
                { label: 'Fri', value: 3500 },
                { label: 'Sat', value: 4200 },
                { label: 'Sun', value: 3900 },
              ],
            },
          },
          {
            id: 'chart-02',
            type: 'chart',
            title: 'Sales by Product Category',
            chartData: {
              type: 'bar',
              data: [
                { label: 'Electronics', value: 12000 },
                { label: 'Apparel', value: 9500 },
                { label: 'Home Goods', value: 7800 },
                { label: 'Books', value: 4500 },
              ],
            },
          },
        ],
      };
      return mockData;
    });
  }
}