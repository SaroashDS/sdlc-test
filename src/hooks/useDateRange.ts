import { useState, useCallback } from 'react';

/**
 * @typedef {Object} DateRange
 * @property {Date | null} startDate - The start date of the range.
 * @property {Date | null} endDate - The end date of the range.
 */
interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * @typedef {Object} UseDateRangeReturn
 * @property {DateRange} dateRange - The current date range.
 * @property {function(Date | null): void} setStartDate - Function to set the start date.
 * @property {function(Date | null): void} setEndDate - Function to set the end date.
 * @property {function(): void} clearDateRange - Function to clear the date range.
 */
interface UseDateRangeReturn {
  dateRange: DateRange;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  clearDateRange: () => void;
}

/**
 * Hook for managing date range state.
 *
 * @returns {UseDateRangeReturn} An object containing the date range and functions to manage it.
 */
const useDateRange = (): UseDateRangeReturn => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  /**
   * Sets the start date of the range.
   *
   * @param {Date | null} date - The new start date.
   */
  const setStartDate = useCallback((date: Date | null) => {
    setDateRange((prev) => ({ ...prev, startDate: date }));
  }, []);

  /**
   * Sets the end date of the range.
   *
   * @param {Date | null} date - The new end date.
   */
  const setEndDate = useCallback((date: Date | null) => {
    setDateRange((prev) => ({ ...prev, endDate: date }));
  }, []);

  /**
   * Clears the date range by setting both start and end dates to null.
   */
  const clearDateRange = useCallback(() => {
    setDateRange({ startDate: null, endDate: null });
  }, []);

  return {
    dateRange,
    setStartDate,
    setEndDate,
    clearDateRange,
  };
};

export default useDateRange;