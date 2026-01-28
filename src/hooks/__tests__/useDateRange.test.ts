import { renderHook, act } from '@testing-library/react-hooks';
import useDateRange from './useDateRange';

describe('useDateRange', () => {
  it('should initialize with null start and end dates', () => {
    const { result } = renderHook(() => useDateRange());
    expect(result.current.dateRange.startDate).toBeNull();
    expect(result.current.dateRange.endDate).toBeNull();
  });

  it('should set the start date correctly', () => {
    const { result } = renderHook(() => useDateRange());
    const newDate = new Date();

    act(() => {
      result.current.setStartDate(newDate);
    });

    expect(result.current.dateRange.startDate).toEqual(newDate);
    expect(result.current.dateRange.endDate).toBeNull();
  });

  it('should set the end date correctly', () => {
    const { result } = renderHook(() => useDateRange());
    const newDate = new Date();

    act(() => {
      result.current.setEndDate(newDate);
    });

    expect(result.current.dateRange.endDate).toEqual(newDate);
    expect(result.current.dateRange.startDate).toBeNull();
  });

  it('should clear the date range correctly', () => {
    const { result } = renderHook(() => useDateRange());
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-05');

    act(() => {
      result.current.setStartDate(startDate);
      result.current.setEndDate(endDate);
    });

    expect(result.current.dateRange.startDate).toEqual(startDate);
    expect(result.current.dateRange.endDate).toEqual(endDate);

    act(() => {
      result.current.clearDateRange();
    });

    expect(result.current.dateRange.startDate).toBeNull();
    expect(result.current.dateRange.endDate).toBeNull();
  });

  it('should handle setting start date to null', () => {
    const { result } = renderHook(() => useDateRange());
    const initialDate = new Date();

    act(() => {
      result.current.setStartDate(initialDate);
    });

    expect(result.current.dateRange.startDate).toEqual(initialDate);

    act(() => {
      result.current.setStartDate(null);
    });

    expect(result.current.dateRange.startDate).toBeNull();
  });

  it('should handle setting end date to null', () => {
    const { result } = renderHook(() => useDateRange());
    const initialDate = new Date();

    act(() => {
      result.current.setEndDate(initialDate);
    });

    expect(result.current.dateRange.endDate).toEqual(initialDate);

    act(() => {
      result.current.setEndDate(null);
    });

    expect(result.current.dateRange.endDate).toBeNull();
  });

  it('should update both start and end dates independently', () => {
    const { result } = renderHook(() => useDateRange());
    const startDate = new Date('2023-02-01');
    const endDate = new Date('2023-02-15');

    act(() => {
      result.current.setStartDate(startDate);
    });

    expect(result.current.dateRange.startDate).toEqual(startDate);
    expect(result.current.dateRange.endDate).toBeNull();

    act(() => {
      result.current.setEndDate(endDate);
    });

    expect(result.current.dateRange.startDate).toEqual(startDate);
    expect(result.current.dateRange.endDate).toEqual(endDate);
  });

  it('should not throw an error when setting invalid dates (e.g., NaN)', () => {
    const { result } = renderHook(() => useDateRange());

    act(() => {
      result.current.setStartDate(new Date('invalid date'));
      result.current.setEndDate(new Date('invalid date'));
    });

    expect(result.current.dateRange.startDate).toEqual(new Date('invalid date'));
    expect(result.current.dateRange.endDate).toEqual(new Date('invalid date'));
  });

  it('should handle setting the same date for both start and end', () => {
    const { result } = renderHook(() => useDateRange());
    const sameDate = new Date('2023-03-10');

    act(() => {
      result.current.setStartDate(sameDate);
      result.current.setEndDate(sameDate);
    });

    expect(result.current.dateRange.startDate).toEqual(sameDate);
    expect(result.current.dateRange.endDate).toEqual(sameDate);
  });

  it('should handle setting start date after end date', () => {
    const { result } = renderHook(() => useDateRange());
    const startDate = new Date('2023-03-15');
    const endDate = new Date('2023-03-10');

    act(() => {
      result.current.setStartDate(startDate);
      result.current.setEndDate(endDate);
    });

    expect(result.current.dateRange.startDate).toEqual(startDate);
    expect(result.current.dateRange.endDate).toEqual(endDate);
  });

  it('should handle setting end date before start date', () => {
    const { result } = renderHook(() => useDateRange());
    const startDate = new Date('2023-03-15');
    const endDate = new Date('2023-03-10');

    act(() => {
      result.current.setEndDate(endDate);
      result.current.setStartDate(startDate);
    });

    expect(result.current.dateRange.startDate).toEqual(startDate);
    expect(result.current.dateRange.endDate).toEqual(endDate);
  });

  it('should clear the date range even if start or end date is invalid', () => {
    const { result } = renderHook(() => useDateRange());

    act(() => {
      result.current.setStartDate(new Date('invalid date'));
      result.current.setEndDate(new Date('invalid date'));
    });

    expect(result.current.dateRange.startDate).toEqual(new Date('invalid date'));
    expect(result.current.dateRange.endDate).toEqual(new Date('invalid date'));

    act(() => {
      result.current.clearDateRange();
    });

    expect(result.current.dateRange.startDate).toBeNull();
    expect(result.current.dateRange.endDate).toBeNull();
  });

  it('should not cause infinite re-renders when using the returned functions', () => {
    const { result } = renderHook(() => useDateRange());
    const initialRenderCount = result.all.length;

    act(() => {
      result.current.setStartDate(new Date());
    });

    act(() => {
      result.current.setEndDate(new Date());
    });

    act(() => {
      result.current.clearDateRange();
    });

    expect(result.all.length).toBeGreaterThan(initialRenderCount);
    expect(result.all.length).toBeLessThan(initialRenderCount + 10); // Arbitrary limit to prevent infinite loop
  });

  it('should return stable function references', () => {
    const { result } = renderHook(() => useDateRange());
    const initialSetStartDate = result.current.setStartDate;
    const initialSetEndDate = result.current.setEndDate;
    const initialClearDateRange = result.current.clearDateRange;

    act(() => {
      result.current.setStartDate(new Date());
    });

    expect(result.current.setStartDate).toBe(initialSetStartDate);
    expect(result.current.setEndDate).toBe(initialSetEndDate);
    expect(result.current.clearDateRange).toBe(initialClearDateRange);
  });
});