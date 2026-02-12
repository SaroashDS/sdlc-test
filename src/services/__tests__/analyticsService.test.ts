import {
  analyticsService,
  DashboardSummary,
  DateRange,
  ProductPerformance,
  SalesDataPoint,
} from './analytics.service';

// --- Mock Data ---

const mockDateRange: DateRange = {
  startDate: '2023-01-01T00:00:00.000Z',
  endDate: '2023-01-31T23:59:59.999Z',
};

const mockDashboardSummary: DashboardSummary = {
  totalRevenue: 150000,
  totalOrders: 1200,
  newCustomers: 350,
  averageOrderValue: 125,
};

const mockSalesOverTime: SalesDataPoint[] = [
  { date: '2023-01-01', sales: 5000 },
  { date: '2023-01-02', sales: 7500 },
];

const mockTopProducts: ProductPerformance[] = [
  { productId: 'prod-1', productName: 'Super Widget', unitsSold: 500, revenue: 50000 },
  { productId: 'prod-2', productName: 'Mega Gadget', unitsSold: 300, revenue: 45000 },
];

const mockUserDemographics: Record<string, number> = {
  '18-24': 400,
  '25-34': 800,
  '35-44': 650,
};

// --- Global Mocks ---

// Mock the global fetch function
global.fetch = jest.fn();

// Mock console.error to keep test output clean and allow spying
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('analyticsService', () => {
  const API_BASE_URL = '/api/v1/analytics';

  beforeEach(() => {
    // Clear all mocks before each test
    (fetch as jest.Mock).mockClear();
    consoleErrorSpy.mockClear();
  });

  // --- Helper function to mock a successful fetch response ---
  const mockFetchSuccess = (data: any) => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => data,
    });
  };

  // --- Helper function to mock a failed fetch response ---
  const mockFetchFailure = (status: number, errorMessage: string, isJson: boolean = true) => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status,
      statusText: 'Error',
      json: isJson
        ? async () => ({ message: errorMessage, statusCode: status })
        : jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    });
  };

  // --- Helper function to mock a network error ---
  const mockFetchNetworkError = (errorMessage: string) => {
    (fetch as jest.Mock).mockRejectedValue(new Error(errorMessage));
  };

  // --- Test Suite for getDashboardSummary ---
  describe('getDashboardSummary', () => {
    it('should fetch dashboard summary data successfully', async () => {
      mockFetchSuccess(mockDashboardSummary);

      const result = await analyticsService.getDashboardSummary(mockDateRange);

      expect(result).toEqual(mockDashboardSummary);
      expect(fetch).toHaveBeenCalledTimes(1);
      const expectedUrl = `${API_BASE_URL}/summary?startDate=${encodeURIComponent(mockDateRange.startDate)}&endDate=${encodeURIComponent(mockDateRange.endDate)}`;
      expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    it('should construct the request with correct headers', async () => {
      mockFetchSuccess(mockDashboardSummary);
      await analyticsService.getDashboardSummary(mockDateRange);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'You do not have permission to access this resource.';
      mockFetchFailure(403, errorMessage);

      await expect(analyticsService.getDashboardSummary(mockDateRange)).rejects.toThrow(errorMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AnalyticsService] API fetch error'),
        expect.any(Error),
      );
    });

    it('should handle network errors', async () => {
      const networkErrorMessage = 'Failed to fetch';
      mockFetchNetworkError(networkErrorMessage);

      await expect(analyticsService.getDashboardSummary(mockDateRange)).rejects.toThrow(networkErrorMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AnalyticsService] API fetch error'),
        expect.any(Error),
      );
    });
  });

  // --- Test Suite for getSalesOverTime ---
  describe('getSalesOverTime', () => {
    it('should fetch sales over time data successfully', async () => {
      mockFetchSuccess(mockSalesOverTime);

      const result = await analyticsService.getSalesOverTime(mockDateRange);

      expect(result).toEqual(mockSalesOverTime);
      expect(fetch).toHaveBeenCalledTimes(1);
      const expectedUrl = `${API_BASE_URL}/sales-over-time?startDate=${encodeURIComponent(mockDateRange.startDate)}&endDate=${encodeURIComponent(mockDateRange.endDate)}`;
      expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Invalid date range provided.';
      mockFetchFailure(400, errorMessage);

      await expect(analyticsService.getSalesOverTime(mockDateRange)).rejects.toThrow(errorMessage);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  // --- Test Suite for getTopPerformingProducts ---
  describe('getTopPerformingProducts', () => {
    it('should fetch top products sorted by revenue by default', async () => {
      mockFetchSuccess(mockTopProducts);
      const limit = 5;

      const result = await analyticsService.getTopPerformingProducts(limit);

      expect(result).toEqual(mockTopProducts);
      expect(fetch).toHaveBeenCalledTimes(1);
      const expectedUrl = `${API_BASE_URL}/top-products?limit=${limit}&sortBy=revenue`;
      expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    it('should fetch top products sorted by unitsSold when specified', async () => {
      mockFetchSuccess(mockTopProducts);
      const limit = 10;
      const sortBy = 'unitsSold';

      await analyticsService.getTopPerformingProducts(limit, sortBy);

      expect(fetch).toHaveBeenCalledTimes(1);
      const expectedUrl = `${API_BASE_URL}/top-products?limit=${limit}&sortBy=${sortBy}`;
      expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Internal Server Error';
      mockFetchFailure(500, errorMessage);

      await expect(analyticsService.getTopPerformingProducts(5)).rejects.toThrow(errorMessage);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  // --- Test Suite for getUserDemographics ---
  describe('getUserDemographics', () => {
    it('should fetch user demographics data successfully', async () => {
      mockFetchSuccess(mockUserDemographics);

      const result = await analyticsService.getUserDemographics();

      expect(result).toEqual(mockUserDemographics);
      expect(fetch).toHaveBeenCalledTimes(1);
      const expectedUrl = `${API_BASE_URL}/user-demographics`;
      expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Not Found';
      mockFetchFailure(404, errorMessage);

      await expect(analyticsService.getUserDemographics()).rejects.toThrow(errorMessage);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  // --- Test Suite for apiFetch generic error handling ---
  describe('apiFetch error handling', () => {
    it('should handle non-JSON error responses', async () => {
      const status = 502;
      const statusText = 'Bad Gateway';
      // Mock a response that is not ok and cannot be parsed as JSON
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status,
        statusText,
        json: () => Promise.reject(new SyntaxError('Unexpected token in JSON')),
      });

      const expectedErrorMessage = `API Error: ${status} ${statusText}`;
      await expect(analyticsService.getUserDemographics()).rejects.toThrow(expectedErrorMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AnalyticsService] API fetch error'),
        expect.any(Error),
      );
    });
  });
});