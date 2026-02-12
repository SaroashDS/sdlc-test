import {
  isNullOrUndefined,
  isEmptyString,
  isValidEmail,
  convertToNumber,
  removeDuplicatesFromArray,
  chunkArray,
} from './dataUtils';

describe('dataUtils', () => {
  describe('isNullOrUndefined', () => {
    it('should return true for null', () => {
      expect(isNullOrUndefined(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isNullOrUndefined(undefined)).toBe(true);
    });

    it('should return false for 0', () => {
      expect(isNullOrUndefined(0)).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(isNullOrUndefined('')).toBe(false);
    });

    it('should return false for a boolean', () => {
      expect(isNullOrUndefined(true)).toBe(false);
      expect(isNullOrUndefined(false)).toBe(false);
    });

    it('should return false for an object', () => {
      expect(isNullOrUndefined({})).toBe(false);
    });

    it('should return false for an array', () => {
      expect(isNullOrUndefined([])).toBe(false);
    });
  });

  describe('isEmptyString', () => {
    it('should return true for an empty string', () => {
      expect(isEmptyString('')).toBe(true);
    });

    it('should return true for a string with only whitespace', () => {
      expect(isEmptyString('   ')).toBe(true);
    });

    it('should return false for a string with characters', () => {
      expect(isEmptyString('hello')).toBe(false);
    });

    it('should return false for a string with leading and trailing whitespace', () => {
      expect(isEmptyString('  hello  ')).toBe(false);
    });

    it('should return false for a number', () => {
      expect(isEmptyString(123 as any)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isEmptyString(null as any)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isEmptyString(undefined as any)).toBe(false);
    });

    it('should return false for an object', () => {
      expect(isEmptyString({} as any)).toBe(false);
    });

    it('should return false for an array', () => {
      expect(isEmptyString([] as any)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for a valid email address', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should return false for an email address with no domain', () => {
      expect(isValidEmail('test@example')).toBe(false);
    });

    it('should return false for an email address with no @ symbol', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should return false for an email address with a space', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should return false for an email address with multiple @ symbols', () => {
      expect(isValidEmail('test@@example.com')).toBe(false);
    });

    it('should return false for an email address with no username', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should return false for an email address with no top-level domain', () => {
      expect(isValidEmail('test@example.')).toBe(false);
    });

    it('should return false for a number', () => {
      expect(isValidEmail(123 as any)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidEmail(null as any)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidEmail(undefined as any)).toBe(false);
    });

    it('should return false for an object', () => {
      expect(isValidEmail({} as any)).toBe(false);
    });

    it('should return false for an array', () => {
      expect(isValidEmail([] as any)).toBe(false);
    });
  });

  describe('convertToNumber', () => {
    it('should convert a string to a number', () => {
      expect(convertToNumber('123')).toBe(123);
    });

    it('should convert a string with decimals to a number', () => {
      expect(convertToNumber('123.45')).toBe(123.45);
    });

    it('should return NaN for a string that cannot be converted', () => {
      expect(convertToNumber('abc')).toBeNaN();
    });

    it('should convert a number to a number', () => {
      expect(convertToNumber(123)).toBe(123);
    });

    it('should convert a boolean to a number', () => {
      expect(convertToNumber(true)).toBe(1);
      expect(convertToNumber(false)).toBe(0);
    });

    it('should convert null to 0', () => {
      expect(convertToNumber(null)).toBe(0);
    });

    it('should convert undefined to NaN', () => {
      expect(convertToNumber(undefined)).toBeNaN();
    });
  });

  describe('removeDuplicatesFromArray', () => {
    it('should remove duplicate values from an array', () => {
      expect(removeDuplicatesFromArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should remove duplicate strings from an array', () => {
      expect(removeDuplicatesFromArray(['a', 'b', 'b', 'c', 'c', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should return an empty array if the input is not an array', () => {
      expect(removeDuplicatesFromArray(null as any)).toEqual([]);
      expect(removeDuplicatesFromArray(undefined as any)).toEqual([]);
      expect(removeDuplicatesFromArray({} as any)).toEqual([]);
      expect(removeDuplicatesFromArray('string' as any)).toEqual([]);
      expect(removeDuplicatesFromArray(123 as any)).toEqual([]);
    });

    it('should handle an empty array', () => {
      expect(removeDuplicatesFromArray([])).toEqual([]);
    });

    it('should handle an array with no duplicates', () => {
      expect(removeDuplicatesFromArray([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle an array with only duplicates', () => {
      expect(removeDuplicatesFromArray([1, 1, 1])).toEqual([1]);
    });

    it('should handle an array with mixed data types', () => {
      expect(removeDuplicatesFromArray([1, '1', 1, '1'])).toEqual([1, '1']);
    });
  });

  describe('chunkArray', () => {
    it('should split an array into chunks of a specified size', () => {
      expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should split an array into chunks of a specified size (different size)', () => {
      expect(chunkArray([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
    });

    it('should return an empty array if the input is not an array', () => {
      expect(chunkArray(null as any, 2)).toEqual([]);
      expect(chunkArray(undefined as any, 2)).toEqual([]);
      expect(chunkArray({} as any, 2)).toEqual([]);
      expect(chunkArray('string' as any, 2)).toEqual([]);
      expect(chunkArray(123 as any, 2)).toEqual([]);
    });

    it('should return the original array if the chunk size is invalid', () => {
      expect(chunkArray([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
      expect(chunkArray([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
      expect(chunkArray([1, 2, 3], NaN)).toEqual([[1, 2, 3]]);
    });

    it('should handle an empty array', () => {
      expect(chunkArray([], 2)).toEqual([]);
    });

    it('should handle a chunk size larger than the array length', () => {
      expect(chunkArray([1, 2, 3], 4)).toEqual([[1, 2, 3]]);
    });

    it('should handle a chunk size equal to the array length', () => {
      expect(chunkArray([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    });
  });
});