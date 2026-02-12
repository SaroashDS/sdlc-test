/**
 * Utility functions for data formatting.
 */
namespace dataFormatter {

  /**
   * Formats a number as currency.
   *
   * @param {number | string | null | undefined} value - The number to format.
   * @param {string} [currency='USD'] - The currency code (e.g., 'USD', 'EUR', 'JPY').
   * @param {string} [locale='en-US'] - The locale to use for formatting (e.g., 'en-US', 'fr-FR').
   * @returns {string} The formatted currency string, or an empty string if the input is invalid.
   *
   * @example
   * // Returns '$1,234.56'
   * dataFormatter.formatCurrency(1234.56);
   *
   * @example
   * // Returns '€1.234,56'
   * dataFormatter.formatCurrency(1234.56, 'EUR', 'de-DE');
   *
   * @example
   * // Returns ''
   * dataFormatter.formatCurrency(null);
   */
  export function formatCurrency(
    value: number | string | null | undefined,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const num = Number(value);

    if (isNaN(num)) {
      return '';
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(num);
    } catch (error) {
      console.error(`Error formatting currency: ${error}`);
      return '';
    }
  }

  /**
   * Formats a date as a string.
   *
   * @param {Date | string | number | null | undefined} value - The date to format.
   * @param {string} [format='MM/DD/YYYY'] - The desired date format.  Supports basic placeholders: MM, DD, YYYY, YY.
   * @returns {string} The formatted date string, or an empty string if the input is invalid.
   *
   * @example
   * // Returns '12/25/2023'
   * dataFormatter.formatDate(new Date(2023, 11, 25));
   *
   * @example
   * // Returns '25/12/2023'
   * dataFormatter.formatDate(new Date(2023, 11, 25), 'DD/MM/YYYY');
   *
   * @example
   * // Returns ''
   * dataFormatter.formatDate(null);
   */
  export function formatDate(
    value: Date | string | number | null | undefined,
    format: string = 'MM/DD/YYYY'
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    let date: Date;

    if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      date = value;
    }

    if (isNaN(date.getTime())) {
      return '';
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear());
    const shortYear = String(date.getFullYear()).slice(-2);

    let formattedDate = format.replace('MM', month);
    formattedDate = formattedDate.replace('DD', day);
    formattedDate = formattedDate.replace('YYYY', year);
    formattedDate = formattedDate.replace('YY', shortYear);

    return formattedDate;
  }

  /**
   * Formats a number with commas for thousands separators.
   *
   * @param {number | string | null | undefined} value - The number to format.
   * @param {string} [locale='en-US'] - The locale to use for formatting (e.g., 'en-US', 'fr-FR').
   * @returns {string} The formatted number string, or an empty string if the input is invalid.
   *
   * @example
   * // Returns '1,234,567.89'
   * dataFormatter.formatNumberWithCommas(1234567.89);
   *
   * @example
   * // Returns '1.234.567,89'
   * dataFormatter.formatNumberWithCommas(1234567.89, 'de-DE');
   *
   * @example
   * // Returns ''
   * dataFormatter.formatNumberWithCommas(null);
   */
  export function formatNumberWithCommas(
    value: number | string | null | undefined,
    locale: string = 'en-US'
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const num = Number(value);

    if (isNaN(num)) {
      return '';
    }

    try {
      return new Intl.NumberFormat(locale).format(num);
    } catch (error) {
      console.error(`Error formatting number with commas: ${error}`);
      return '';
    }
  }

  /**
   * Converts a string to title case.
   *
   * @param {string | null | undefined} str - The string to convert.
   * @returns {string} The title-cased string, or an empty string if the input is invalid.
   *
   * @example
   * // Returns 'Hello World'
   * dataFormatter.toTitleCase('hello world');
   *
   * @example
   * // Returns 'The Quick Brown Fox'
   * dataFormatter.toTitleCase('the quick brown fox');
   *
   * @example
   * // Returns ''
   * dataFormatter.toTitleCase(null);
   */
  export function toTitleCase(str: string | null | undefined): string {
    if (!str) {
      return '';
    }

    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}