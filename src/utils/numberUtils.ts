/**
 * @module numberUtils
 * @description Number formatting utilities.
 */

/**
 * @function formatCurrency
 * @description Formats a number as currency.
 * @param {number} amount - The number to format.
 * @param {string} [currencyCode='USD'] - The currency code (e.g., 'USD', 'EUR', 'JPY').
 * @param {string} [locale='en-US'] - The locale to use for formatting (e.g., 'en-US', 'de-DE').
 * @returns {string} The formatted currency string. Returns 'Invalid Input' if the input is not a valid number.
 * @throws {Error} If the currency code or locale is invalid.
 *
 * @example
 * // Returns '$1,234.56'
 * formatCurrency(1234.56);
 *
 * @example
 * // Returns '€1.234,56'
 * formatCurrency(1234.56, 'EUR', 'de-DE');
 *
 * @example
 * // Returns '¥1,235'
 * formatCurrency(1234.56, 'JPY', 'ja-JP');
 *
 * @example
 * // Returns 'Invalid Input'
 * formatCurrency(NaN);
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD', locale: string = 'en-US'): string {
  if (isNaN(amount) || !Number.isFinite(amount)) {
    return 'Invalid Input';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    throw new Error(`Invalid currency code or locale: ${error}`);
  }
}

/**
 * @function formatNumber
 * @description Formats a number with commas and specified decimal places.
 * @param {number} number - The number to format.
 * @param {number} [decimalPlaces=2] - The number of decimal places to include.  Must be between 0 and 20 inclusive.
 * @param {string} [locale='en-US'] - The locale to use for formatting (e.g., 'en-US', 'de-DE').
 * @returns {string} The formatted number string. Returns 'Invalid Input' if the input is not a valid number.
 * @throws {Error} If the number of decimal places is invalid.
 *
 * @example
 * // Returns '1,234.56'
 * formatNumber(1234.56);
 *
 * @example
 * // Returns '1.234,56'
 * formatNumber(1234.56, 2, 'de-DE');
 *
 * @example
 * // Returns '1,235'
 * formatNumber(1234.56, 0);
 *
 * @example
 * // Returns 'Invalid Input'
 * formatNumber(NaN);
 */
export function formatNumber(number: number, decimalPlaces: number = 2, locale: string = 'en-US'): string {
  if (isNaN(number) || !Number.isFinite(number)) {
    return 'Invalid Input';
  }

  if (decimalPlaces < 0 || decimalPlaces > 20) {
    throw new Error('Number of decimal places must be between 0 and 20.');
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(number);
}

/**
 * @function formatPercentage
 * @description Formats a number as a percentage.
 * @param {number} number - The number to format (e.g., 0.75 for 75%).
 * @param {number} [decimalPlaces=2] - The number of decimal places to include.  Must be between 0 and 20 inclusive.
 * @param {string} [locale='en-US'] - The locale to use for formatting (e.g., 'en-US', 'de-DE').
 * @returns {string} The formatted percentage string. Returns 'Invalid Input' if the input is not a valid number.
 * @throws {Error} If the number of decimal places is invalid.
 *
 * @example
 * // Returns '75.00%'
 * formatPercentage(0.75);
 *
 * @example
 * // Returns '75%'
 * formatPercentage(0.75, 0);
 *
 * @example
 * // Returns '75,00%'
 * formatPercentage(0.75, 2, 'de-DE');
 *
 * @example
 * // Returns 'Invalid Input'
 * formatPercentage(NaN);
 */
export function formatPercentage(number: number, decimalPlaces: number = 2, locale: string = 'en-US'): string {
  if (isNaN(number) || !Number.isFinite(number)) {
    return 'Invalid Input';
  }

  if (decimalPlaces < 0 || decimalPlaces > 20) {
    throw new Error('Number of decimal places must be between 0 and 20.');
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(number);
}

/**
 * @function isValidNumber
 * @description Checks if a value is a valid number (not NaN, Infinity, or -Infinity).
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is a valid number, false otherwise.
 *
 * @example
 * // Returns true
 * isValidNumber(123);
 *
 * @example
 * // Returns false
 * isValidNumber(NaN);
 *
 * @example
 * // Returns false
 * isValidNumber("123");
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && Number.isFinite(value);
}