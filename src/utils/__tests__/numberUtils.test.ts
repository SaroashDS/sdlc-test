import { formatCurrency, formatNumber, formatPercentage, isValidNumber } from './numberUtils';

describe('numberUtils', () => {
  describe('formatCurrency', () => {
    it('should format a number as currency with default values', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format a number as currency with specified currency code and locale', () => {
      expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toBe('1.234,56 €');
    });

    it('should format a number as currency with JPY and Japanese locale', () => {
      expect(formatCurrency(1234.56, 'JPY', 'ja-JP')).toBe('￥1,235');
    });

    it('should return "Invalid Input" for NaN input', () => {
      expect(formatCurrency(NaN)).toBe('Invalid Input');
    });

    it('should return "Invalid Input" for Infinity input', () => {
      expect(formatCurrency(Infinity)).toBe('Invalid Input');
    });

    it('should return "Invalid Input" for -Infinity input', () => {
      expect(formatCurrency(-Infinity)).toBe('Invalid Input');
    });

    it('should throw an error for invalid currency code', () => {
      expect(() => formatCurrency(1234.56, 'XXX', 'en-US')).toThrowError('Invalid currency code or locale: RangeError: Invalid language tag: XXX');
    });

    it('should throw an error for invalid locale', () => {
      expect(() => formatCurrency(1234.56, 'USD', 'xx-XX')).toThrowError('Invalid currency code or locale: RangeError: Invalid language tag: xx-XX');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle large numbers correctly', () => {
      expect(formatCurrency(1234567890.12)).toBe('$1,234,567,890.12');
    });
  });

  describe('formatNumber', () => {
    it('should format a number with commas and default decimal places', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });

    it('should format a number with specified decimal places and locale', () => {
      expect(formatNumber(1234.56, 2, 'de-DE')).toBe('1.234,56');
    });

    it('should format a number with zero decimal places', () => {
      expect(formatNumber(1234.56, 0)).toBe('1,235');
    });

    it('should return "Invalid Input" for NaN input', () => {
      expect(formatNumber(NaN)).toBe('Invalid Input');
    });

    it('should return "Invalid Input" for Infinity input', () => {
      expect(formatNumber(Infinity)).toBe('Invalid Input');
    });

    it('should return "Invalid Input" for -Infinity input', () => {
      expect(formatNumber(-Infinity)).toBe('Invalid Input');
    });

    it('should throw an error for invalid decimal places (negative)', () => {
      expect(() => formatNumber(1234.56, -1)).toThrowError('Number of decimal places must be between 0 and 20.');
    });

    it('should throw an error for invalid decimal places (too large)', () => {
      expect(() => formatNumber(1234.56, 21)).toThrowError('Number of decimal places must be between 0 and 20.');
    });

    it('should format zero correctly', () => {
      expect(formatNumber(0)).toBe('0.00');
    });

    it('should format negative numbers correctly', () => {
      expect(formatNumber(-1234.56)).toBe('-1,234.56');
    });

    it('should handle large numbers correctly', () => {
      expect(formatNumber(1234567890.12)).toBe('1,234,567,890.12');
    });

    it('should handle decimal places correctly when less than available', () => {
      expect(formatNumber(1234.5, 2)).toBe('1,234.50');
    });
  });

  describe('formatPercentage', () => {
    it('should format a number as a percentage with default decimal places', () => {
      expect(formatPercentage(0.75)).toBe('75.00%');
    });

    it('should format a number as a percentage with zero decimal places', () => {
      expect(formatPercentage(0.75, 0)).toBe('75%');
    });

    it('should format a number as a percentage with specified decimal places and locale', () => {
      expect(formatPercentage(0.75, 2, 'de-DE')).toBe('75,00 %');
    });

    it('should return "Invalid Input" for NaN input', () => {
      expect(formatPercentage(NaN)).toBe('Invalid Input');
    });

    it('should return "Invalid Input" for Infinity input', () => {
      expect(formatPercentage(Infinity)).toBe('Invalid Input');
    });

    it('should return "Invalid Input" for -Infinity input', () => {
      expect(formatPercentage(-Infinity)).toBe('Invalid Input');
    });

    it('should throw an error for invalid decimal places (negative)', () => {
      expect(() => formatPercentage(0.75, -1)).toThrowError('Number of decimal places must be between 0 and 20.');
    });

    it('should throw an error for invalid decimal places (too large)', () => {
      expect(() => formatPercentage(0.75, 21)).toThrowError('Number of decimal places must be between 0 and 20.');
    });

    it('should format zero correctly', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('should format negative numbers correctly', () => {
      expect(formatPercentage(-0.75)).toBe('-75.00%');
    });

    it('should handle values greater than 1 correctly', () => {
      expect(formatPercentage(1.5)).toBe('150.00%');
    });

    it('should handle decimal places correctly when less than available', () => {
      expect(formatPercentage(0.755, 2)).toBe('75.50%');
    });
  });

  describe('isValidNumber', () => {
    it('should return true for a valid number', () => {
      expect(isValidNumber(123)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isValidNumber(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValidNumber(Infinity)).toBe(false);
    });

    it('should return false for -Infinity', () => {
      expect(isValidNumber(-Infinity)).toBe(false);
    });

    it('should return false for a string', () => {
      expect(isValidNumber("123")).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidNumber(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidNumber(undefined)).toBe(false);
    });

    it('should return false for an object', () => {
      expect(isValidNumber({})).toBe(false);
    });

    it('should return false for an array', () => {
      expect(isValidNumber([])).toBe(false);
    });

    it('should return true for 0', () => {
      expect(isValidNumber(0)).toBe(true);
    });

    it('should return true for a negative number', () => {
      expect(isValidNumber(-123)).toBe(true);
    });

    it('should return true for a decimal number', () => {
      expect(isValidNumber(123.45)).toBe(true);
    });
  });
});