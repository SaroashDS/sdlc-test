import AnalyticsService from '../analytics.service';
import axios from 'axios';

jest.mock('axios');

describe('AnalyticsService', () => {
  const baseUrl = 'https://api.example.com';
  let analyticsService: AnalyticsService;
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    analyticsService = new AnalyticsService(baseUrl);
    mockedAxios = axios as jest.Mocked<typeof axios>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an instance of AnalyticsService', () => {
    expect(analyticsService).toBeInstanceOf(AnalyticsService);
  });

  describe('getAnalyticsData', () => {
    const mockParams = {
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      metrics: ['impressions', 'clicks'],
      dimensions: ['date'],
    };

    it('should successfully fetch analytics data', async () => {
      const mockResponse = {
        data: [{ date: '2023-01-01', impressions: 100, clicks: 10 }],
        totalResults: 1,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await analyticsService.getAnalyticsData(mockParams);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/analytics`, { params: mockParams });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors and throw an error', async () => {
      const mockError = new Error('Request failed');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(analyticsService.getAnalyticsData(mockParams)).rejects.toThrow('Request failed');
      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/analytics`, { params: mockParams });
    });

    it('should handle Axios errors and throw an error with status code', async () => {
      const mockAxiosError = {
        isAxiosError: true,
        message: 'Request failed with status code 404',
        response: {
          status: 404,
          data: { message: 'Not Found' },
          headers: {},
          config: {},
          statusText: 'Not Found',
        },
        config: {},
      } as any;

      mockedAxios.get.mockRejectedValue(mockAxiosError);

      await expect(analyticsService.getAnalyticsData(mockParams)).rejects.toThrow('Request failed with status code 404 Status: 404');
      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/analytics`, { params: mockParams });
    });

    it('should handle Axios errors without response and throw an error', async () => {
      const mockAxiosError = {
        isAxiosError: true,
        message: 'Network Error',
        config: {},
      } as any;

      mockedAxios.get.mockRejectedValue(mockAxiosError);

      await expect(analyticsService.getAnalyticsData(mockParams)).rejects.toThrow('Network Error');
      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/analytics`, { params: mockParams });
    });

    it('should handle generic errors and throw an error', async () => {
        const mockError = new Error('Generic Error');
        mockedAxios.get.mockRejectedValue(mockError);

        await expect(analyticsService.getAnalyticsData(mockParams)).rejects.toThrow('Generic Error');
        expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/analytics`, { params: mockParams });
    });

    it('should call the API with the correct parameters', async () => {
      const mockResponse = {
        data: [{ date: '2023-01-01', impressions: 100, clicks: 10 }],
        totalResults: 1,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      await analyticsService.getAnalyticsData(mockParams);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/analytics`, { params: mockParams });
    });

    it('should handle empty dimensions array', async () => {
      const paramsWithoutDimensions = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        metrics: ['impressions', 'clicks'],
      };

      const mockResponse = {
        data: [{ impressions: 100, clicks: 10 }],
        totalResults: 1,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      await analyticsService.getAnalyticsData(paramsWithoutDimensions as any);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/analytics`, { params: paramsWithoutDimensions });
    });
  });
});