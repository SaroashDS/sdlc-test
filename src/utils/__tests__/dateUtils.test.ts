import {
  parseDate,
  formatDate,
  addDays,
  subtractDays,
  isSameDay,
  getStartOfDay,
  getEndOfDay,
  isLeapYear,
  getDaysInMonth,
  timeAgo,
} from './dateUtils';

describe('dateUtils', () => {
  // A fixed date for consistent testing: 2023-10-26 14:30:45.500 UTC
  const testDate = new Date('2023-10-26T14:30:45.500Z');
  const testTimestamp = testDate.getTime();
  const testISOString = testDate.toISOString();

  // =================================================================
  // parseDate
  // =================================================================
  describe('parseDate', () => {
    it('should parse a valid Date object', () => {
      const date = new Date();
      expect(parseDate(date)).toEqual(date);
    });

    it('should parse a valid ISO date string', () => {
      const parsed = parseDate('2023-10-26T10:00:00.000Z');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.toISOString()).toBe('2023-10-26T10:00:00.000Z');
    });

    it('should parse a valid number (timestamp)', () => {
      const parsed = parseDate(testTimestamp);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getTime()).toBe(testTimestamp);
    });

    it('should return null for an invalid date string', () => {
      expect(parseDate('not a real date')).toBeNull();
    });

    it('should return null for an invalid Date object', () => {
      const invalidDate = new Date('invalid');
      expect(parseDate(invalidDate)).toBeNull();
    });

    it('should return null for other invalid inputs', () => {
      // @ts-expect-error Testing invalid input type
      expect(parseDate(null)).toBeNull();
      // @ts-expect-error Testing invalid input type
      expect(parseDate(undefined)).toBeNull();
      // @ts-expect-error Testing invalid input type
      expect(parseDate({})).toBeNull();
    });
  });

  // =================================================================
  // formatDate
  // =================================================================
  describe('formatDate', () => {
    // A specific date for formatting tests: Jan 5, 2024, 07:08:09
    const formatTestDate = new Date('2024-01-05T07:08:09.000Z');

    it('should return an empty string for an invalid date', () => {
      expect(formatDate('invalid-date', 'YYYY-MM-DD')).toBe('');
    });

    it('should format a date with all tokens correctly', () => {
      const formatStr = 'YYYY-YY MMMM-MMM MM-M DD-D hh-h mm-m ss-s';
      const expected = '2024-24 January-Jan 01-1 05-5 07-7 08-8 09-9';
      expect(formatDate(formatTestDate, formatStr)).toBe(expected);
    });

    it('should handle padding for single-digit values', () => {
      const date = new Date('2023-01-02T03:04:05Z');
      expect(formatDate(date, 'MM-DD hh:mm:ss')).toBe('01-02 03:04:05');
    });

    it('should handle double-digit values correctly', () => {
      const date = new Date('2023-11-12T13:14:15Z');
      expect(formatDate(date, 'MM-DD hh:mm:ss')).toBe('11-12 13:14:15');
    });

    it('should format a date from a timestamp', () => {
      expect(formatDate(formatTestDate.getTime(), 'YYYY/MM/DD')).toBe('2024/01/05');
    });

    it('should format a date from an ISO string', () => {
      expect(formatDate('2024-01-05T07:08:09.000Z', 'MMM D, YYYY')).toBe('Jan 5, 2024');
    });

    it('should handle repeated tokens correctly', () => {
      expect(formatDate(formatTestDate, 'YYYY YYYY')).toBe('2024 2024');
    });
  });

  // =================================================================
  // addDays
  // =================================================================
  describe('addDays', () => {
    it('should add a positive number of days', () => {
      const result = addDays(testDate, 5);
      expect(result?.getUTCDate()).toBe(31);
      expect(result?.getUTCMonth()).toBe(9); // October
    });

    it('should handle adding a negative number of days', () => {
      const result = addDays(testDate, -5);
      expect(result?.getUTCDate()).toBe(21);
    });

    it('should return the same date when adding zero days', () => {
      const result = addDays(testDate, 0);
      expect(result?.getTime()).toBe(testDate.getTime());
    });

    it('should correctly cross a month boundary', () => {
      const result = addDays('2023-10-30', 3);
      expect(formatDate(result!, 'YYYY-MM-DD')).toBe('2023-11-02');
    });

    it('should correctly cross a year boundary', () => {
      const result = addDays('2023-12-30', 3);
      expect(formatDate(result!, 'YYYY-MM-DD')).toBe('2024-01-02');
    });

    it('should correctly handle leap years', () => {
      const result = addDays('2024-02-28', 2);
      expect(formatDate(result!, 'YYYY-MM-DD')).toBe('2024-03-01');
    });

    it('should return null for an invalid date', () => {
      expect(addDays('invalid-date', 5)).toBeNull();
    });

    it('should not mutate the original date object', () => {
      const originalDate = new Date(testDate);
      addDays(originalDate, 10);
      expect(originalDate.getTime()).toBe(testDate.getTime());
    });
  });

  // =================================================================
  // subtractDays
  // =================================================================
  describe('subtractDays', () => {
    it('should subtract a positive number of days', () => {
      const result = subtractDays(testDate, 5);
      expect(result?.getUTCDate()).toBe(21);
    });

    it('should handle subtracting a negative number of days', () => {
      const result = subtractDays(testDate, -5);
      expect(result?.getUTCDate()).toBe(31);
    });

    it('should correctly cross a month boundary', () => {
      const result = subtractDays('2023-11-02', 3);
      expect(formatDate(result!, 'YYYY-MM-DD')).toBe('2023-10-30');
    });

    it('should correctly cross a year boundary', () => {
      const result = subtractDays('2024-01-02', 3);
      expect(formatDate(result!, 'YYYY-MM-DD')).toBe('2023-12-30');
    });

    it('should return null for an invalid date', () => {
      expect(subtractDays('invalid-date', 5)).toBeNull();
    });
  });

  // =================================================================
  // isSameDay
  // =================================================================
  describe('isSameDay', () => {
    it('should return true for two Date objects on the same day with different times', () => {
      const date1 = new Date('2023-10-26T08:00:00Z');
      const date2 = new Date('2023-10-26T23:00:00Z');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return true for a string and a Date object on the same day', () => {
      const date1 = '2023-10-26';
      const date2 = new Date('2023-10-26T12:00:00Z');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for dates on different days', () => {
      expect(isSameDay('2023-10-26', '2023-10-27')).toBe(false);
    });

    it('should return false for dates in different months', () => {
      expect(isSameDay('2023-10-26', '2023-11-26')).toBe(false);
    });

    it('should return false for dates in different years', () => {
      expect(isSameDay('2023-10-26', '2024-10-26')).toBe(false);
    });

    it('should return false if one date is invalid', () => {
      expect(isSameDay('2023-10-26', 'invalid-date')).toBe(false);
    });

    it('should return false if both dates are invalid', () => {
      expect(isSameDay('invalid-1', 'invalid-2')).toBe(false);
    });
  });

  // =================================================================
  // getStartOfDay
  // =================================================================
  describe('getStartOfDay', () => {
    it('should return a new Date object set to 00:00:00.000', () => {
      const result = getStartOfDay(testDate);
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(testDate.getFullYear());
      expect(result?.getMonth()).toBe(testDate.getMonth());
      expect(result?.getDate()).toBe(testDate.getDate());
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
      expect(result?.getSeconds()).toBe(0);
      expect(result?.getMilliseconds()).toBe(0);
    });

    it('should not mutate the original date object', () => {
      const originalDate = new Date(testDate);
      getStartOfDay(originalDate);
      expect(originalDate.getTime()).toBe(testDate.getTime());
    });

    it('should return null for an invalid date', () => {
      expect(getStartOfDay('invalid-date')).toBeNull();
    });
  });

  // =================================================================
  // getEndOfDay
  // =================================================================
  describe('getEndOfDay', () => {
    it('should return a new Date object set to 23:59:59.999', () => {
      const result = getEndOfDay(testDate);
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(testDate.getFullYear());
      expect(result?.getMonth()).toBe(testDate.getMonth());
      expect(result?.getDate()).toBe(testDate.getDate());
      expect(result?.getHours()).toBe(23);
      expect(result?.getMinutes()).toBe(59);
      expect(result?.getSeconds()).toBe(59);
      expect(result?.getMilliseconds()).toBe(999);
    });

    it('should not mutate the original date object', () => {
      const originalDate = new Date(testDate);
      getEndOfDay(originalDate);
      expect(originalDate.getTime()).toBe(testDate.getTime());
    });

    it('should return null for an invalid date', () => {
      expect(getEndOfDay('invalid-date')).toBeNull();
    });
  });

  // =================================================================
  // isLeapYear
  // =================================================================
  describe('isLeapYear', () => {
    it('should return true for years divisible by 4 but not 100', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
    });

    it('should return true for years divisible by 400', () => {
      expect(isLeapYear(2000)).toBe(true);
    });

    it('should return false for years not divisible by 4', () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2021)).toBe(false);
    });

    it('should return false for years divisible by 100 but not 400', () => {
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
    });
  });

  // =================================================================
  // getDaysInMonth
  // =================================================================
  describe('getDaysInMonth', () => {
    it('should return 31 for months with 31 days', () => {
      expect(getDaysInMonth(2023, 1)).toBe(31); // Jan
      expect(getDaysInMonth(2023, 7)).toBe(31); // Jul
      expect(getDaysInMonth(2023, 12)).toBe(31); // Dec
    });

    it('should return 30 for months with 30 days', () => {
      expect(getDaysInMonth(2023, 4)).toBe(30); // Apr
      expect(getDaysInMonth(2023, 6)).toBe(30); // Jun
      expect(getDaysInMonth(2023, 11)).toBe(30); // Nov
    });

    it('should return 28 for February in a common year', () => {
      expect(getDaysInMonth(2023, 2)).toBe(28);
    });

    it('should return 29 for February in a leap year', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
    });

    it('should return 0 for an invalid month', () => {
      expect(getDaysInMonth(2023, 0)).toBe(0);
      expect(getDaysInMonth(2023, 13)).toBe(0);
    });
  });

  // =================================================================
  // timeAgo
  // =================================================================
  describe('timeAgo', () => {
    const now = new Date('2023-10-26T12:00:00Z');

    it('should return "Invalid date" for invalid input', () => {
      expect(timeAgo('not a date', now)).toBe('Invalid date');
    });

    it('should return "just now" for times less than 10 seconds ago', () => {
      const date = new Date('2023-10-26T11:59:55Z');
      expect(timeAgo(date, now)).toBe('just now');
    });

    it('should return "just now" for times less than 10 seconds in the future', () => {
      const date = new Date('2023-10-26T12:00:05Z');
      expect(timeAgo(date, now)).toBe('just now');
    });

    // Past
    it('should handle seconds ago', () => {
      const date = new Date('2023-10-26T11:59:45Z');
      expect(timeAgo(date, now)).toBe('15 seconds ago');
    });

    it('should handle a minute ago', () => {
      const date = new Date('2023-10-26T11:59:00Z');
      expect(timeAgo(date, now)).toBe('1 minute ago');
    });

    it('should handle minutes ago', () => {
      const date = new Date('2023-10-26T11:55:00Z');
      expect(timeAgo(date, now)).toBe('5 minutes ago');
    });

    it('should handle an hour ago', () => {
      const date = new Date('2023-10-26T11:00:00Z');
      expect(timeAgo(date, now)).toBe('1 hour ago');
    });

    it('should handle hours ago', () => {
      const date = new Date('2023-10-26T08:00:00Z');
      expect(timeAgo(date, now)).toBe('4 hours ago');
    });

    it('should handle a day ago', () => {
      const date = new Date('2023-10-25T12:00:00Z');
      expect(timeAgo(date, now)).toBe('1 day ago');
    });

    it('should handle days ago', () => {
      const date = new Date('2023-10-23T12:00:00Z');
      expect(timeAgo(date, now)).toBe('3 days ago');
    });

    it('should handle a month ago', () => {
      const date = new Date('2023-09-26T12:00:00Z');
      expect(timeAgo(date, now)).toBe('1 month ago');
    });

    it('should handle a year ago', () => {
      const date = new Date('2022-10-26T12:00:00Z');
      expect(timeAgo(date, now)).toBe('1 year ago');
    });

    // Future
    it('should handle in seconds', () => {
      const date = new Date('2023-10-26T12:00:15Z');
      expect(timeAgo(date, now)).toBe('in 15 seconds');
    });

    it('should handle in a minute', () => {
      const date = new Date('2023-10-26T12:01:00Z');
      expect(timeAgo(date, now)).toBe('in 1 minute');
    });

    it('should handle in minutes', () => {
      const date = new Date('2023-10-26T12:05:00Z');
      expect(timeAgo(date, now)).toBe('in 5 minutes');
    });

    it('should handle in an hour', () => {
      const date = new Date('2023-10-26T13:00:00Z');
      expect(timeAgo(date, now)).toBe('in 1 hour');
    });

    it('should handle in hours', () => {
      const date = new Date('2023-10-26T16:00:00Z');
      expect(timeAgo(date, now)).toBe('in 4 hours');
    });

    it('should handle in a day', () => {
      const date = new Date('2023-10-27T12:00:00Z');
      expect(timeAgo(date, now)).toBe('in 1 day');
    });

    it('should handle in days', () => {
      const date = new Date('2023-10-29T12:00:00Z');
      expect(timeAgo(date, now)).toBe('in 3 days');
    });

    it('should handle in a month', () => {
      const date = new Date('2023-11-26T12:00:00Z');
      expect(timeAgo(date, now)).toBe('in 1 month');
    });

    it('should handle in a year', () => {
      const date = new Date('2024-10-26T12:00:00Z');
      expect(timeAgo(date, now)).toBe('in 1 year');
    });
  });
});