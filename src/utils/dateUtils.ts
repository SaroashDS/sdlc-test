/**
 * @file dateUtils.ts
 * @description Helper functions for formatting and manipulating dates.
 */

/**
 * A type representing a value that can be parsed into a Date.
 */
type DateResolvable = Date | string | number;

/**
 * Safely parses a value into a Date object.
 * Returns null if the value is invalid.
 *
 * @param {DateResolvable} dateValue - The value to parse (Date, string, or number).
 * @returns {Date | null} A valid Date object or null.
 * @example
 * // parseDate('2023-10-26') -> Date object for Oct 26, 2023
 * // parseDate('invalid-date') -> null
 * // parseDate(new Date()) -> Date object for now
 * // parseDate(1672531200000) -> Date object for Jan 1, 2023
 */
export const parseDate = (dateValue: DateResolvable): Date | null => {
  if (dateValue instanceof Date) {
    return !isNaN(dateValue.getTime()) ? dateValue : null;
  }
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return !isNaN(date.getTime()) ? date : null;
  }
  return null;
};

/**
 * Formats a date into a specified string format.
 * Supported tokens:
 * YYYY: 4-digit year (e.g., 2023)
 * YY: 2-digit year (e.g., 23)
 * MMMM: Full month name (e.g., January)
 * MMM: Short month name (e.g., Jan)
 * MM: 2-digit month (01-12)
 * M: Month (1-12)
 * DD: 2-digit day (01-31)
 * D: Day (1-31)
 * hh: 2-digit hour (00-23)
 * h: Hour (0-23)
 * mm: 2-digit minute (00-59)
 * m: Minute (0-59)
 * ss: 2-digit second (00-59)
 * s: Second (0-59)
 *
 * @param {DateResolvable} dateValue - The date to format.
 * @param {string} formatStr - The format string with tokens.
 * @returns {string} The formatted date string, or an empty string if the date is invalid.
 * @example
 * // formatDate(new Date('2023-01-05T14:08:03'), 'YYYY-MM-DD hh:mm:ss') -> '2023-01-05 14:08:03'
 * // formatDate('2023-05-01', 'MMM D, YYYY') -> 'May 1, 2023'
 * // formatDate('invalid-date', 'YYYY-MM-DD') -> ''
 */
export const formatDate = (dateValue: DateResolvable, formatStr: string): string => {
  const date = parseDate(dateValue);
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const replacements: { [key: string]: string } = {
    YYYY: String(year),
    YY: String(year).slice(-2),
    MMMM: monthNames[month],
    MMM: monthNames[month].substring(0, 3),
    MM: String(month + 1).padStart(2, '0'),
    M: String(month + 1),
    DD: String(day).padStart(2, '0'),
    D: String(day),
    hh: String(hours).padStart(2, '0'),
    h: String(hours),
    mm: String(minutes).padStart(2, '0'),
    m: String(minutes),
    ss: String(seconds).padStart(2, '0'),
    s: String(seconds),
  };

  return formatStr.replace(
    /YYYY|YY|MMMM|MMM|MM|M|DD|D|hh|h|mm|m|ss|s/g,
    (match) => replacements[match]
  );
};

/**
 * Adds a specified number of days to a date.
 *
 * @param {DateResolvable} dateValue - The date to which days will be added.
 * @param {number} days - The number of days to add (can be negative).
 * @returns {Date | null} A new Date object with the added days, or null if the input date is invalid.
 * @example
 * // const date = new Date('2023-10-26');
 * // addDays(date, 5) -> Date object for Oct 31, 2023
 * // addDays(date, -5) -> Date object for Oct 21, 2023
 */
export const addDays = (dateValue: DateResolvable, days: number): Date | null => {
  const date = parseDate(dateValue);
  if (!date) {
    return null;
  }
  const newDate = new Date(date.valueOf());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * Subtracts a specified number of days from a date.
 *
 * @param {DateResolvable} dateValue - The date from which days will be subtracted.
 * @param {number} days - The number of days to subtract (can be negative).
 * @returns {Date | null} A new Date object with the subtracted days, or null if the input date is invalid.
 * @example
 * // const date = new Date('2023-10-26');
 * // subtractDays(date, 5) -> Date object for Oct 21, 2023
 * // subtractDays(date, -5) -> Date object for Oct 31, 2023
 */
export const subtractDays = (dateValue: DateResolvable, days: number): Date | null => {
  return addDays(dateValue, -days);
};

/**
 * Checks if two dates are on the same day, ignoring the time component.
 *
 * @param {DateResolvable} date1 - The first date.
 * @param {DateResolvable} date2 - The second date.
 * @returns {boolean} True if the dates are on the same day, false otherwise.
 * @example
 * // isSameDay('2023-10-26T10:00:00', '2023-10-26T18:00:00') -> true
 * // isSameDay('2023-10-26', '2023-10-27') -> false
 */
export const isSameDay = (date1: DateResolvable, date2: DateResolvable): boolean => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 || !d2) {
    return false;
  }

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Returns the start of the day (00:00:00.000) for a given date.
 *
 * @param {DateResolvable} dateValue - The date.
 * @returns {Date | null} A new Date object set to the start of the day, or null if invalid.
 * @example
 * // const date = new Date('2023-10-26T14:30:00');
 * // getStartOfDay(date) -> Date object for 2023-10-26T00:00:00.000
 */
export const getStartOfDay = (dateValue: DateResolvable): Date | null => {
  const date = parseDate(dateValue);
  if (!date) {
    return null;
  }
  const newDate = new Date(date.valueOf());
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Returns the end of the day (23:59:59.999) for a given date.
 *
 * @param {DateResolvable} dateValue - The date.
 * @returns {Date | null} A new Date object set to the end of the day, or null if invalid.
 * @example
 * // const date = new Date('2023-10-26T14:30:00');
 * // getEndOfDay(date) -> Date object for 2023-10-26T23:59:59.999
 */
export const getEndOfDay = (dateValue: DateResolvable): Date | null => {
  const date = parseDate(dateValue);
  if (!date) {
    return null;
  }
  const newDate = new Date(date.valueOf());
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Checks if a given year is a leap year.
 *
 * @param {number} year - The year to check.
 * @returns {boolean} True if it's a leap year, false otherwise.
 * @example
 * // isLeapYear(2020) -> true
 * // isLeapYear(2021) -> false
 * // isLeapYear(2000) -> true
 * // isLeapYear(1900) -> false
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Gets the number of days in a specific month of a year.
 *
 * @param {number} year - The year.
 * @param {number} month - The month (1 for January, 12 for December).
 * @returns {number} The number of days in the month. Returns 0 for invalid month.
 * @example
 * // getDaysInMonth(2023, 2) -> 28
 * // getDaysInMonth(2024, 2) -> 29 (leap year)
 * // getDaysInMonth(2023, 4) -> 30
 */
export const getDaysInMonth = (year: number, month: number): number => {
  if (month < 1 || month > 12) {
    return 0;
  }
  // The '0' day of the next month gives the last day of the current month.
  // `month` is 1-based, but `new Date` month is 0-based, so this works perfectly.
  return new Date(year, month, 0).getDate();
};

/**
 * Calculates a human-readable "time ago" string.
 *
 * @param {DateResolvable} dateValue - The date to compare against the current time.
 * @param {Date} [now=new Date()] - The current date, for testing purposes.
 * @returns {string} A relative time string (e.g., "5 minutes ago", "in 3 days").
 * @example
 * // const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
 * // timeAgo(fiveMinutesAgo) -> "5 minutes ago"
 * // const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
 * // timeAgo(threeDaysFromNow) -> "in 3 days"
 * // timeAgo('invalid-date') -> "Invalid date"
 */
export const timeAgo = (dateValue: DateResolvable, now: Date = new Date()): string => {
  const date = parseDate(dateValue);
  if (!date) {
    return 'Invalid date';
  }

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const isFuture = seconds < 0;
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 10) {
    return 'just now';
  }

  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  let counter;
  for (const interval in intervals) {
    counter = Math.floor(absSeconds / intervals[interval]);
    if (counter > 0) {
      const plural = counter === 1 ? '' : 's';
      if (isFuture) {
        return `in ${counter} ${interval}${plural}`;
      }
      return `${counter} ${interval}${plural} ago`;
    }
  }

  // Fallback for seconds
  const plural = absSeconds === 1 ? '' : 's';
  if (isFuture) {
    return `in ${absSeconds} second${plural}`;
  }
  return `${absSeconds} second${plural} ago`;
};