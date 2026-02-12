import {
  MockApiService,
  ApiError,
  DashboardData,
  Widget,
  KpiWidget,
  ChartWidget,
} from './mockApiService';

// --- Test Suite for ApiError Class ---

describe('ApiError', () => {
  it('should create an instance of ApiError with correct properties', () => {
    const errorMessage = 'Test Error';
    const errorStatus = 404;
    const error = new ApiError(errorMessage, errorStatus);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(errorMessage);
    expect(error.status).toBe(errorStatus);
    expect(error.name).toBe('ApiError');
  });
});

// --- Test Suite for MockApiService ---

describe('MockApiService', () => {
  // Use fake timers to control setTimeout behavior
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks(); // Restore any spies or mocks
  });

  // --- Constructor Tests ---
  describe('constructor', () => {
    it('should initialize with a default delay of 1000ms', () => {
      const service = new MockApiService();
      // Accessing private property for testing purposes
      expect((service as any)._mockDelay).toBe(1000);
    });

    it('should initialize with a custom delay when provided', () => {
      const customDelay = 500;
      const service = new MockApiService({ delay: customDelay });
      expect((service as any)._mockDelay).toBe(customDelay);
    });

    it('should initialize with a delay of 0', () => {
        const service = new MockApiService({ delay: 0 });
        expect((service as any)._mockDelay).toBe(0);
    });
  });

  // --- getDashboardData Method Tests ---
  describe('getDashboardData', () => {
    // --- Success Scenarios ---
    describe('on success', () => {
      it('should resolve with DashboardData after the configured delay', async () => {
        const delay = 500;
        const service = new MockApiService({ delay });
        const promise = service.getDashboardData();

        // At this point, the promise is pending
        const pendingSpy = jest.fn();
        promise.then(pendingSpy);
        expect(pendingSpy).not.toHaveBeenCalled();

        // Fast-forward time by the delay
        jest.advanceTimersByTime(delay);

        // Now the promise should resolve
        await expect(promise).resolves.toBeDefined();
      });

      it('should return data that conforms to the DashboardData interface', async () => {
        const service = new MockApiService({ delay: 0 });
        const promise = service.getDashboardData();
        jest.runAllTimers();
        const data = await promise;

        expect(data).toHaveProperty('id');
        expect(typeof data.id).toBe('string');

        expect(data).toHaveProperty('title');
        expect(typeof data.title).toBe('string');

        expect(data).toHaveProperty('lastUpdated');
        expect(typeof data.lastUpdated).toBe('string');
        // Check if it's a valid ISO string
        expect(!isNaN(Date.parse(data.lastUpdated))).toBe(true);

        expect(data).toHaveProperty('widgets');
        expect(Array.isArray(data.widgets)).toBe(true);
      });

      it('should return widgets with correct structures', async () => {
        const service = new MockApiService({ delay: 0 });
        const promise = service.getDashboardData();
        jest.runAllTimers();
        const { widgets } = await promise;

        expect(widgets.length).toBeGreaterThan(0);

        const kpiWidget = widgets.find(w => w.type === 'kpi') as KpiWidget;
        expect(kpiWidget).toBeDefined();
        expect(kpiWidget).toHaveProperty('id', expect.any(String));
        expect(kpiWidget).toHaveProperty('type', 'kpi');
        expect(kpiWidget).toHaveProperty('title', expect.any(String));
        expect(kpiWidget).toHaveProperty('value', expect.any(String));
        expect(kpiWidget).toHaveProperty('trend', expect.stringMatching(/^(up|down|stable)$/));
        expect(kpiWidget).toHaveProperty('trendPercentage', expect.any(Number));

        const chartWidget = widgets.find(w => w.type === 'chart') as ChartWidget;
        expect(chartWidget).toBeDefined();
        expect(chartWidget).toHaveProperty('id', expect.any(String));
        expect(chartWidget).toHaveProperty('type', 'chart');
        expect(chartWidget).toHaveProperty('title', expect.any(String));
        expect(chartWidget).toHaveProperty('chartData');
        expect(chartWidget.chartData).toHaveProperty('type', expect.stringMatching(/^(line|bar)$/));
        expect(chartWidget.chartData).toHaveProperty('data', expect.any(Array));
        expect(chartWidget.chartData.data[0]).toHaveProperty('label', expect.any(String));
        expect(chartWidget.chartData.data[0]).toHaveProperty('value', expect.any(Number));
      });
    });

    // --- Error Scenarios ---
    describe('on error', () => {
      it('should reject with an ApiError when forceError is set to true', async () => {
        const service = new MockApiService({ delay: 0 });
        service.setForceError(true);

        const promise = service.getDashboardData();
        jest.runAllTimers();

        await expect(promise).rejects.toBeInstanceOf(ApiError);
      });

      it('should reject with a specific error message and status code', async () => {
        const service = new MockApiService({ delay: 0 });
        service.setForceError(true);

        const promise = service.getDashboardData();
        jest.runAllTimers();

        await expect(promise).rejects.toMatchObject({
          message: 'Failed to fetch data from the server.',
          status: 500,
          name: 'ApiError',
        });
      });

      it('should log an error to the console when rejecting', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const service = new MockApiService({ delay: 0 });
        service.setForceError(true);

        const promise = service.getDashboardData();
        jest.runAllTimers();

        // We need to catch the rejection to prevent an unhandled promise rejection warning
        await promise.catch(() => {});

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('MockApiService: Simulating a 500 server error.');
      });
    });
  });

  // --- setForceError Method Tests ---
  describe('setForceError', () => {
    it('should correctly toggle the error state for subsequent calls', async () => {
      const service = new MockApiService({ delay: 0 });

      // 1. Start with error state
      service.setForceError(true);
      const errorPromise = service.getDashboardData();
      jest.runAllTimers();
      await expect(errorPromise).rejects.toBeInstanceOf(ApiError);

      // 2. Toggle to success state
      service.setForceError(false);
      const successPromise = service.getDashboardData();
      jest.runAllTimers();
      await expect(successPromise).resolves.toBeDefined();

      // 3. Toggle back to error state
      service.setForceError(true);
      const anotherErrorPromise = service.getDashboardData();
      jest.runAllTimers();
      await expect(anotherErrorPromise).rejects.toBeInstanceOf(ApiError);
    });
  });
});