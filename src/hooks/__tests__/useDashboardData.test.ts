import { renderHook, act } from '@testing-library/react-hooks';
import useDashboardData from './useDashboardData';
import { DashboardData } from './useDashboardData';

const mockDashboardData: DashboardData = {
  totalUsers: 100,
  activeUsers: 80,
  newOrders: 10,
  revenue: 1000,
};

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the correct initial state', () => {
    const { result } = renderHook(() => useDashboardData());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch data successfully and update the state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDashboardData),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useDashboardData());

    await waitForNextUpdate();

    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/dashboard');
  });

  it('should handle fetch errors and update the state', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch')) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useDashboardData());

    await waitForNextUpdate();

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/dashboard');
  });

  it('should handle HTTP errors and update the state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useDashboardData());

    await waitForNextUpdate();

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('HTTP error! status: 500');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/dashboard');
  });

  it('should refresh data when refreshData is called', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDashboardData),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useDashboardData());

    await waitForNextUpdate();

    expect(result.current.data).toEqual(mockDashboardData);

    const newMockDashboardData: DashboardData = {
      totalUsers: 200,
      activeUsers: 160,
      newOrders: 20,
      revenue: 2000,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(newMockDashboardData),
    });

    act(() => {
      result.current.refreshData();
    });

    await waitForNextUpdate();

    expect(result.current.data).toEqual(newMockDashboardData);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle an unexpected error', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    const { result, waitForNextUpdate } = renderHook(() => useDashboardData());

    await waitForNextUpdate();

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('An unexpected error occurred.');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle an empty response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useDashboardData());

    await waitForNextUpdate();

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle a response with missing fields', async () => {
    const incompleteData = {
      totalUsers: 100,
      activeUsers: 80,
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(incompleteData),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useDashboardData());

    await waitForNextUpdate();

    expect(result.current.data).toEqual(incompleteData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});