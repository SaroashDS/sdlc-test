/**
 * @module AnalyticsService
 * @description API service for fetching analytics data.
 */

import axios, { AxiosResponse, AxiosError } from 'axios';

/**
 * @interface AnalyticsRequestParams
 * @description Interface for analytics request parameters.
 */
interface AnalyticsRequestParams {
  startDate: string;
  endDate: string;
  metrics: string[];
  dimensions?: string[];
}

/**
 * @interface AnalyticsResponse
 * @description Interface for analytics response data.
 */
interface AnalyticsResponse {
  data: any[];
  totalResults: number;
}

/**
 * @class AnalyticsService
 * @description Service class for fetching analytics data.
 */
class AnalyticsService {
  private readonly baseUrl: string;

  /**
   * @constructor
   * @param {string} baseUrl - The base URL for the analytics API.
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * @async
   * @method getAnalyticsData
   * @description Fetches analytics data from the API.
   * @param {AnalyticsRequestParams} params - The request parameters.
   * @returns {Promise<AnalyticsResponse>} - A promise that resolves to the analytics data.
   * @throws {Error} - If the API request fails.
   */
  public async getAnalyticsData(params: AnalyticsRequestParams): Promise<AnalyticsResponse> {
    try {
      const response: AxiosResponse<AnalyticsResponse> = await axios.get<AnalyticsResponse>(`${this.baseUrl}/analytics`, {
        params,
      });

      return response.data;
    } catch (error: any) {
      let errorMessage = 'Failed to fetch analytics data.';
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        errorMessage = axiosError.message;
        if (axiosError.response) {
          errorMessage += ` Status: ${axiosError.response.status}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }
}

export default AnalyticsService;