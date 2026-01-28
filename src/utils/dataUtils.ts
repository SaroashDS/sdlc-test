/**
 * @module dataUtils
 * @description A collection of utility functions for data processing.
 */

/**
 * @function isNullOrUndefined
 * @description Checks if a value is null or undefined.
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is null or undefined, false otherwise.
 *
 * @example
 * // returns true
 * dataUtils.isNullOrUndefined(null);
 *
 * @example
 * // returns true
 * dataUtils.isNullOrUndefined(undefined);
 *
 * @example
 * // returns false
 * dataUtils.isNullOrUndefined(0);
 */
export function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined;
}

/**
 * @function isEmptyString
 * @description Checks if a string is empty (after trimming whitespace).
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string is empty, false otherwise.  Returns false if input is not a string.
 *
 * @example
 * // returns true
 * dataUtils.isEmptyString("");
 *
 * @example
 * // returns true
 * dataUtils.isEmptyString("   ");
 *
 * @example
 * // returns false
 * dataUtils.isEmptyString("hello");
 */
export function isEmptyString(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }
  return str.trim().length === 0;
}

/**
 * @function isValidEmail
 * @description Checks if a string is a valid email address.
 * @param {string} email - The email address to check.
 * @returns {boolean} True if the email is valid, false otherwise.
 *
 * @example
 * // returns true
 * dataUtils.isValidEmail("test@example.com");
 *
 * @example
 * // returns false
 * dataUtils.isValidEmail("test@example");
 *
 * @example
 * // returns false
 * dataUtils.isValidEmail("testexample.com");
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * @function convertToNumber
 * @description Converts a value to a number. Returns NaN if the value cannot be converted.
 * @param {any} value - The value to convert.
 * @returns {number} The converted number, or NaN if the value cannot be converted.
 *
 * @example
 * // returns 123
 * dataUtils.convertToNumber("123");
 *
 * @example
 * // returns 123.45
 * dataUtils.convertToNumber("123.45");
 *
 * @example
 * // returns NaN
 * dataUtils.convertToNumber("abc");
 */
export function convertToNumber(value: any): number {
  const num = Number(value);
  return num;
}

/**
 * @function removeDuplicatesFromArray
 * @description Removes duplicate values from an array.
 * @param {T[]} arr - The array to remove duplicates from.
 * @returns {T[]} A new array with duplicate values removed.
 *
 * @example
 * // returns [1, 2, 3]
 * dataUtils.removeDuplicatesFromArray([1, 2, 2, 3, 3, 3]);
 *
 * @example
 * // returns ['a', 'b', 'c']
 * dataUtils.removeDuplicatesFromArray(['a', 'b', 'b', 'c', 'c', 'c']);
 */
export function removeDuplicatesFromArray<T>(arr: T[]): T[] {
  if (!Array.isArray(arr)) {
    return []; // Or throw an error, depending on desired behavior
  }
  return [...new Set(arr)];
}

/**
 * @function chunkArray
 * @description Splits an array into chunks of a specified size.
 * @param {T[]} arr - The array to chunk.
 * @param {number} chunkSize - The size of each chunk.
 * @returns {T[][]} An array of arrays, where each inner array is a chunk of the original array.
 *
 * @example
 * // returns [[1, 2], [3, 4], [5]]
 * dataUtils.chunkArray([1, 2, 3, 4, 5], 2);
 *
 * @example
 * // returns [[1, 2, 3], [4, 5]]
 * dataUtils.chunkArray([1, 2, 3, 4, 5], 3);
 */
export function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  if (!Array.isArray(arr)) {
    return [];
  }

  if (typeof chunkSize !== 'number' || chunkSize <= 0) {
    return [arr]; // Return the original array if chunkSize is invalid
  }

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}