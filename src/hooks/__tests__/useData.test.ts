import { renderHook, act } from '@testing-library/react-hooks';
import useData from '../src/useData';

const mockData = { id: 1, name: 'Test Data' };

describe('useData Hook', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the correct initial state', () => {
    const { result } = renderHook(() => useData<typeof mockData>('test-url', false));

    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.data).toBeNull();
    expect(result.current.state.error).toBeNull();
  });

  it('should fetch data successfully when initialFetch is true', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useData<typeof mockData>('test-url'));

    expect(result.current.state.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.data).toEqual(mockData);
    expect(result.current.state.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('test-url');
  });

  it('should fetch data successfully when fetchData is called', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const { result } = renderHook(() => useData<typeof mockData>('test-url', false));

    expect(result.current.state.loading).toBe(false);

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.data).toEqual(mockData);
    expect(result.current.state.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('test-url');
  });

  it('should handle API errors correctly', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useData<typeof mockData>('test-url'));

    expect(result.current.state.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.data).toBeNull();
    expect(result.current.state.error).toBeInstanceOf(Error);
    expect(result.current.state.error?.message).toBe('HTTP error! Status: 404');
  });

  it('should handle network errors correctly', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() => useData<typeof mockData>('test-url'));

    expect(result.current.state.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.data).toBeNull();
    expect(result.current.state.error).toBeInstanceOf(Error);
    expect(result.current.state.error?.message).toBe('Network error');
  });

  it('should not fetch data immediately when initialFetch is false', () => {
    global.fetch = jest.fn();

    renderHook(() => useData<typeof mockData>('test-url', false));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle empty data response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useData<typeof mockData>('test-url'));

    await waitForNextUpdate();

    expect(result.current.state.data).toBeNull();
  });

  it('should handle different data types', async () => {
    const mockNumberData = 123;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockNumberData),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useData<number>('test-url'));

    await waitForNextUpdate();

    expect(result.current.state.data).toBe(mockNumberData);
  });

  it('should handle an empty URL', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

    const { result, waitForNextUpdate } = renderHook(() => useData<typeof mockData>(''));

    await waitForNextUpdate();

    expect(result.current.state.error).toBeInstanceOf(Error);
  });

  it('should handle a URL with special characters', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as jest.Mock;

    const { result, waitForNextUpdate } = renderHook(() => useData<typeof mockData>('https://example.com/data?param1=value1&param2=value2'));

    await waitForNextUpdate();

    expect(result.current.state.data).toEqual(mockData);
  });
});