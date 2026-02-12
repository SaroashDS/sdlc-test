import {
  dashboardService,
  DashboardServiceError,
  Kpi,
  ChartData,
  ActivityItem,
  DateRange,
} from './dashboardService';

// ============================================================================
// Mock Data
// ============================================================================

const mockKpis: Kpi[] = [
  { id: 'revenue', title: 'Total Revenue', value: '$50,000', change: '+10%', changeType: 'increase' },
  { id: 'sales', title: 'Sales', value: '+1,234', change: '+5%', changeType: 'increase' },
];

const mockChartData: ChartData = {
  title: 'Monthly Sales',
  dataPoints: [
    { label: 'Jan', value: 1000 },
    { label: 'Feb', value: 1500 },
  ],
};

const mockActivityItems: ActivityItem[] = [
  { id: 'act1', user: { name: 'John Doe' }, action: 'logged in.', timestamp: new Date().toISOString() },
  { id: 'act2', user: { name: 'Jane Smith' }, action: 'updated settings.', timestamp: new Date().toISOString() },
];

// ============================================================================
// Test Suite
// ============================================================================

describe('dashboardService', () => {
  // Spy on the private _fetchData method to mock API calls
  // We use `as any` because _fetchData is private
  let fetchDataSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock the internal fetcher for all tests
    fetchDataSpy = jest.spyOn(dashboardService as any, '_fetchData');
    // Suppress console.error output during tests for cleaner results
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original implementations after each test
    fetchDataSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // ============================================================================
  // getKpis() Tests
  // ============================================================================
  describe('getKpis', () => {
    it('should fetch and return KPIs successfully', async () => {
      fetchDataSpy.mockResolvedValue(mockKpis);

      const kpis = await dashboardService.getKpis();

      expect(kpis).toEqual(mockKpis);
      expect(kpis.length).toBe(2);
      expect(kpis[0].id).toBe('revenue');
      expect(fetchDataSpy).toHaveBeenCalledTimes(1);
      expect(fetchDataSpy).toHaveBeenCalledWith('/kpis');
    });

    it('should throw DashboardServiceError on API failure', async () => {
      const originalError = new Error('Network Error');
      fetchDataSpy.mockRejectedValue(new DashboardServiceError('Failed to fetch', originalError));

      await expect(dashboardService.getKpis()).rejects.toThrow(DashboardServiceError);
      await expect(dashboardService.getKpis()).rejects.toThrow('Failed to fetch');
    });

    it('should have the correct cause in the thrown error', async () => {
        const originalError = new Error('Network Error');
        fetchDataSpy.mockRejectedValue(new DashboardServiceError('API call failed', originalError));
  
        try {
          await dashboardService.getKpis();
        } catch (error) {
          expect(error).toBeInstanceOf(DashboardServiceError);
          if (error instanceof DashboardServiceError) {
            expect(error.cause).toBe(originalError);
          }
        }
      });
  });

  // ============================================================================
  // getSalesChartData() Tests
  // ============================================================================
  describe('getSalesChartData', () => {
    const dateRange: DateRange = {
      startDate: new Date('2023-01-01T00:00:00.000Z'),
      endDate: new Date('2023-01-31T23:59:59.999Z'),
    };

    it('should fetch and return chart data successfully', async () => {
      fetchDataSpy.mockResolvedValue(mockChartData);

      const chartData = await dashboardService.getSalesChartData(dateRange);

      expect(chartData).toEqual(mockChartData);
      expect(chartData.title).toBe('Monthly Sales');
      expect(chartData.dataPoints).toBeInstanceOf(Array);
      expect(fetchDataSpy).toHaveBeenCalledTimes(1);
    });

    it('should call _fetchData with correctly formatted query parameters', async () => {
      fetchDataSpy.mockResolvedValue(mockChartData);
      await dashboardService.getSalesChartData(dateRange);

      const expectedStartDate = dateRange.startDate.toISOString();
      const expectedEndDate = dateRange.endDate.toISOString();
      const expectedUrl = `/sales-chart?startDate=${encodeURIComponent(expectedStartDate)}&endDate=${encodeURIComponent(expectedEndDate)}`;

      expect(fetchDataSpy).toHaveBeenCalledWith(expectedUrl);
    });

    it('should throw DashboardServiceError on API failure', async () => {
      const originalError = new Error('404 Not Found');
      fetchDataSpy.mockRejectedValue(new DashboardServiceError('Failed to fetch chart data', originalError));

      await expect(dashboardService.getSalesChartData(dateRange)).rejects.toThrow(DashboardServiceError);
      await expect(dashboardService.getSalesChartData(dateRange)).rejects.toThrow('Failed to fetch chart data');
    });
  });

  // ============================================================================
  // getRecentActivity() Tests
  // ============================================================================
  describe('getRecentActivity', () => {
    it('should fetch recent activity with default limit', async () => {
      fetchDataSpy.mockResolvedValue(mockActivityItems);

      const activity = await dashboardService.getRecentActivity();

      expect(activity).toEqual(mockActivityItems);
      expect(fetchDataSpy).toHaveBeenCalledTimes(1);
      expect(fetchDataSpy).toHaveBeenCalledWith('/recent-activity?limit=5');
    });

    it('should fetch recent activity with a custom limit', async () => {
      fetchDataSpy.mockResolvedValue(mockActivityItems);
      const customLimit = 10;

      const activity = await dashboardService.getRecentActivity(customLimit);

      expect(activity).toEqual(mockActivityItems);
      expect(fetchDataSpy).toHaveBeenCalledTimes(1);
      expect(fetchDataSpy).toHaveBeenCalledWith(`/recent-activity?limit=${customLimit}`);
    });

    it('should throw DashboardServiceError on API failure', async () => {
      const originalError = new Error('Server Error');
      fetchDataSpy.mockRejectedValue(new DashboardServiceError('Failed to fetch activity', originalError));

      await expect(dashboardService.getRecentActivity()).rejects.toThrow(DashboardServiceError);
      await expect(dashboardService.getRecentActivity()).rejects.toThrow('Failed to fetch activity');
    });
  });

  // ============================================================================
  // _fetchData() Simulation Tests (Testing the mock implementation in the service)
  // ============================================================================
  describe('_fetchData (internal simulation)', () => {
    // We need to test the actual implementation of the private method, not our spy
    // To do this, we can create a new instance or call the original implementation
    // For simplicity, we'll just call the original method directly.
    const originalFetchData = (dashboardService as any)._fetchData.bind(dashboardService);

    beforeAll(() => {
        // Since we spy on _fetchData in other tests, we need to ensure we're not using the spy here.
        // The `beforeEach` in the parent describe block will re-spy it for other tests.
        jest.restoreAllMocks(); 
        // We also need to suppress console.log which is called inside the original _fetchData
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should return mock KPIs for /kpis endpoint', async () => {
      const data = await originalFetchData('/kpis');
      expect(data).toBeInstanceOf(Array);
      expect(data[0]).toHaveProperty('id', 'revenue');
    });

    it('should return mock chart data for /sales-chart endpoint', async () => {
      const data = await originalFetchData('/sales-chart?date=today');
      expect(data).toHaveProperty('title', 'Sales Overview');
      expect(data.dataPoints).toBeInstanceOf(Array);
    });

    it('should return mock activity for /recent-activity endpoint', async () => {
      const data = await originalFetchData('/recent-activity?limit=3');
      expect(data).toBeInstanceOf(Array);
      expect(data[0]).toHaveProperty('id', 'act1');
    });

    it('should throw a DashboardServiceError for an unknown endpoint', async () => {
      await expect(originalFetchData('/unknown-endpoint')).rejects.toThrow(DashboardServiceError);
      await expect(originalFetchData('/unknown-endpoint')).rejects.toThrow('Failed to fetch data from endpoint: /unknown-endpoint');
    });
  });

  // ============================================================================
  // DashboardServiceError Tests
  // ============================================================================
  describe('DashboardServiceError', () => {
    it('should create an error with a message', () => {
      const error = new DashboardServiceError('Something went wrong');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DashboardServiceError);
      expect(error.name).toBe('DashboardServiceError');
      expect(error.message).toBe('Something went wrong');
      expect(error.cause).toBeUndefined();
    });

    it('should create an error with a message and a cause', () => {
      const cause = new Error('Original error');
      const error = new DashboardServiceError('Something went wrong', cause);
      expect(error.message).toBe('Something went wrong');
      expect(error.cause).toBe(cause);
    });
  });
});