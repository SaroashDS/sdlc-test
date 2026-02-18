import { convertToCSV, convertToJSON, downloadData } from './export.util';

describe('export.util', () => {
  describe('convertToCSV', () => {
    it('should convert an array of objects to a CSV string', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const expectedCSV = 'name,age\nJohn Doe,30\nJane Doe,25';
      expect(convertToCSV(data)).toBe(expectedCSV);
    });

    it('should handle empty data array', () => {
      const data: [] = [];
      expect(convertToCSV(data)).toBe('');
    });

    it('should use custom headers if provided', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const headers = ['Name', 'Age'];
      const expectedCSV = 'Name,Age\nJohn Doe,30\nJane Doe,25';
      expect(convertToCSV(data, headers)).toBe(expectedCSV);
    });

    it('should use a custom delimiter if provided', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const delimiter = ';';
      const expectedCSV = 'name;age\nJohn Doe;30\nJane Doe;25';
      expect(convertToCSV(data, undefined, delimiter)).toBe(expectedCSV);
    });

    it('should handle string values with double quotes', () => {
      const data = [{ name: 'John "The Rock" Doe', age: 30 }];
      const expectedCSV = 'name,age\n"John ""The Rock"" Doe",30';
      expect(convertToCSV(data)).toBe(expectedCSV);
    });

    it('should handle null and undefined values', () => {
      const data = [{ name: null, age: undefined }];
      const expectedCSV = 'name,age\n,';
      expect(convertToCSV(data)).toBe(expectedCSV);
    });

    it('should handle numeric and boolean values', () => {
      const data = [{ value: 123, flag: true }];
      const expectedCSV = 'value,flag\n123,true';
      expect(convertToCSV(data)).toBe(expectedCSV);
    });

    it('should throw an error if data is not an array', () => {
      // @ts-expect-error
      expect(() => convertToCSV('not an array')).toThrow('Data must be an array.');
    });

    it('should throw an error if data contains non-object elements', () => {
      // @ts-expect-error
      expect(() => convertToCSV([1, 2, 3])).toThrow('Data must be an array of objects.');
    });

    it('should return an empty string if the first object has no keys and no headers are provided', () => {
      const data = [{}];
      expect(convertToCSV(data)).toBe('');
    });

    it('should handle empty headers array', () => {
      const data = [{ name: 'John Doe', age: 30 }];
      const headers: string[] = [];
      const expectedCSV = '\nJohn Doe,30';
      expect(convertToCSV(data, headers)).toBe(expectedCSV);
    });

    it('should handle different data types in the same column', () => {
      const data = [{ value: 123 }, { value: 'abc' }, { value: true }];
      const expectedCSV = 'value\n123\nabc\ntrue';
      expect(convertToCSV(data)).toBe(expectedCSV);
    });
  });

  describe('convertToJSON', () => {
    it('should convert an array of objects to a JSON string with indentation', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const expectedJSON = JSON.stringify(data, null, 2);
      expect(convertToJSON(data)).toBe(expectedJSON);
    });

    it('should convert an array of objects to a JSON string without indentation', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const expectedJSON = JSON.stringify(data, null, 0);
      expect(convertToJSON(data, 0)).toBe(expectedJSON);
    });

    it('should handle empty data array', () => {
      const data: [] = [];
      expect(convertToJSON(data)).toBe('[]');
    });

    it('should throw an error if data is not an array', () => {
      // @ts-expect-error
      expect(() => convertToJSON('not an array')).toThrow('Data must be an array.');
    });

    it('should throw an error if data contains non-object elements', () => {
      // @ts-expect-error
      expect(() => convertToJSON([1, 2, 3])).toThrow('Data must be an array of objects.');
    });

    it('should handle null and undefined values', () => {
      const data = [{ name: null, age: undefined }];
      const expectedJSON = JSON.stringify(data, null, 2);
      expect(convertToJSON(data)).toBe(expectedJSON);
    });

    it('should handle numeric and boolean values', () => {
      const data = [{ value: 123, flag: true }];
      const expectedJSON = JSON.stringify(data, null, 2);
      expect(convertToJSON(data)).toBe(expectedJSON);
    });

    it('should handle empty objects', () => {
      const data = [{}];
      const expectedJSON = JSON.stringify(data, null, 2);
      expect(convertToJSON(data)).toBe(expectedJSON);
    });
  });

  describe('downloadData', () => {
    let mockCreateObjectURL: jest.SpyInstance;
    let mockAppendChild: jest.SpyInstance;
    let mockRemoveChild: jest.SpyInstance;
    let mockRevokeObjectURL: jest.SpyInstance;

    beforeEach(() => {
      mockCreateObjectURL = jest.spyOn(URL, 'createObjectURL');
      mockRevokeObjectURL = jest.spyOn(URL, 'revokeObjectURL');
      mockAppendChild = jest.spyOn(document.body, 'appendChild');
      mockRemoveChild = jest.spyOn(document.body, 'removeChild');

      // Mock the 'a' element and its properties
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      };

      jest.spyOn(document, 'createElement').mockImplementation(() => mockAnchor as any);
    });

    afterEach(() => {
      mockCreateObjectURL.mockRestore();
      mockRevokeObjectURL.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      jest.restoreAllMocks();
    });

    it('should create a blob, URL, and trigger a download', () => {
      const data = 'Hello, world!';
      const filename = 'hello.txt';
      const mimeType = 'text/plain';

      downloadData(data, filename, mimeType);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      const mockAnchor = (document.createElement as jest.Mock).mock.results[0].value;
      expect(mockAnchor.download).toBe(filename);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should handle different data types', () => {
      const data = JSON.stringify({ message: 'Hello' });
      const filename = 'data.json';
      const mimeType = 'application/json';

      downloadData(data, filename, mimeType);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      const mockAnchor = (document.createElement as jest.Mock).mock.results[0].value;
      expect(mockAnchor.download).toBe(filename);
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });
});