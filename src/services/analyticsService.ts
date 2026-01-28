/**
 * @file analytics.service.ts
 * @description Service for fetching dashboard-specific data from the REST API.
 */

// --- Interfaces for API Requests and Responses ---

/**
 * Represents a date range for filtering analytics data.
 */
export interface DateRange {
  /** Start date in ISO 8601 format (e.g., "2023-01-01T00:00:00.000Z") */
  startDate: string;
  /** End date in ISO 8601 format (e.g., "2023-01-31T23:59:59.999Z") */
  endDate: string;
}

/**
 * Represents the summary data for the main dashboard.
 */
export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
  averageOrderValue: number;
}

/**
 * Represents a single data point in a time-series chart.
 */
export interface SalesDataPoint {
  /** The date for this data point (e.g., "2023-10-26") */
  date: string;
  /** The total sales value for this date */
  sales: number;
}

/**
 * Represents the performance data for a single product.
 */
export interface ProductPerformance {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

/**
 * Represents an error response from the API.
 */
interface ApiError {
  message: string;
  statusCode: number;
}

// --- Service Implementation ---

const API_BASE_URL = '/api/v1/analytics';

/**
 * A generic and reusable fetch wrapper for making API calls.
 * It handles standard headers, base URL, and error handling.
 *
 * @template T The expected type of the successful JSON response.
 * @param {string} endpoint The API endpoint to call (e.g., '/summary').
 * @param {RequestInit} [options] Optional fetch options (e.g., method, body).
 * @returns {Promise<T>} A promise that resolves with the parsed JSON response.
 * @throws Will throw an error if the network request fails or the API returns a non-ok status.
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        message: `API Error: ${response.status} ${response.statusText}`,
        statusCode: response.status,
      }));
      throw new Error(errorData.message);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`[AnalyticsService] API fetch error at ${endpoint}:`, error);
    // Re-throw the error so the calling component can handle it (e.g., show a toast notification).
    throw error;
  }
}

/**
 * Service module for fetching dashboard-specific data from the REST API.
 */
export const analyticsService = {
  /**
   * Fetches the main dashboard summary data for a given date range.
   *
   * @param {DateRange} dateRange - The start and end dates for the summary.
   * @returns {Promise<DashboardSummary>} A promise that resolves to the dashboard summary data.
   */
  async getDashboardSummary(dateRange: DateRange): Promise<DashboardSummary> {
    const queryParams = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }).toString();
    return apiFetch<DashboardSummary>(`/summary?${queryParams}`);
  },

  /**
   * Fetches sales data over time for a given date range.
   * Useful for plotting line or bar charts.
   *
   * @param {DateRange} dateRange - The start and end dates for the time-series data.
   * @returns {Promise<SalesDataPoint[]>} A promise that resolves to an array of sales data points.
   */
  async getSalesOverTime(dateRange: DateRange): Promise<SalesDataPoint[]> {
    const queryParams = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }).toString();
    return apiFetch<SalesDataPoint[]>(`/sales-over-time?${queryParams}`);
  },

  /**
   * Fetches a list of top-performing products based on revenue or units sold.
   *
   * @param {number} limit - The maximum number of products to return.
   * @param {'revenue' | 'unitsSold'} [sortBy='revenue'] - The metric to sort by.
   * @returns {Promise<ProductPerformance[]>} A promise that resolves to an array of top-performing products.
   */
  async getTopPerformingProducts(
    limit: number,
    sortBy: 'revenue' | 'unitsSold' = 'revenue'
  ): Promise<ProductPerformance[]> {
    const queryParams = new URLSearchParams({
      limit: String(limit),
      sortBy,
    }).toString();
    return apiFetch<ProductPerformance[]>(`/top-products?${queryParams}`);
  },

  /**
   * Fetches user demographics data, such as age groups or location.
   *
   * @returns {Promise<Record<string, number>>} A promise that resolves to an object containing demographics data,
   * where keys are categories (e.g., "18-24") and values are counts.
   */
  async getUserDemographics(): Promise<Record<string, number>> {
    return apiFetch<Record<string, number>>(`/user-demographics`);
  },
};