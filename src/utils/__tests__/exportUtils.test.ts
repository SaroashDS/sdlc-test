import { convertToCSV, convertToJSON, downloadData } from './exportUtils';

describe('exportUtils', () => {
  describe('convertToCSV', () => {
    it('should convert an array of objects to a CSV string with default delimiter', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const expectedCSV = 'name,age\nJohn Doe,30\nJane Doe,25';
      expect(convertToCSV(data)).toBe(expectedCSV);
    });

    it('should convert an array of objects to a CSV string with a custom delimiter', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const expectedCSV = 'name;age\nJohn Doe;30\nJane Doe;25';
      expect(convertToCSV(data, ';')).toBe(expectedCSV);
    });

    it('should convert an array of objects to a CSV string with specific fields', () => {
      const data = [{ name: 'John Doe', age: 30, city: 'New York' }, { name: 'Jane Doe', age: 25, city: 'London' }];
      const expectedCSV = 'name,age\nJohn Doe,30\nJane Doe,25';
      expect(convertToCSV(data, ',', ['name', 'age'])).toBe(expectedCSV);
    });

    it('should return an empty string if the input data is an empty array', () => {
      const data: object[] = [];
      expect(convertToCSV(data)).toBe('');
    });

    it('should throw an error if the input data is not an array', () => {
      // @ts-expect-error
      expect(() => convertToCSV("not an array")).toThrowError("Input data must be an array.");
    });

    it('should handle null and undefined values', () => {
      const data = [{ name: null, age: undefined }, { name: 'Jane Doe', age: 25 }];
      const expectedCSV = 'name,age\n,\nJane Doe,25';
      expect(convertToCSV(data)).toBe('name,age\n,\nJane Doe,25');
    });

    it('should escape double quotes in values', () => {
      const data = [{ name: 'John "The Rock" Doe', age: 30 }];
      const expectedCSV = 'name,age\nJohn ""The Rock"" Doe,30';
      expect(convertToCSV(data)).toBe(expectedCSV);
    });

    it('should handle empty keys array', () => {
      const data = [{ name: 'John Doe', age: 30 }];
      expect(convertToCSV(data, ',', [])).toBe('');
    });

    it('should handle missing keys in some objects', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe' }];
      const expectedCSV = 'name,age\nJohn Doe,30\nJane Doe,';
      expect(convertToCSV(data)).toBe(expectedCSV);
    });
  });

  describe('convertToJSON', () => {
    it('should convert an array of objects to a JSON string with default indentation', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const expectedJSON = JSON.stringify(data, null, 2);
      expect(convertToJSON(data)).toBe(expectedJSON);
    });

    it('should convert an array of objects to a JSON string with no indentation', () => {
      const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
      const expectedJSON = JSON.stringify(data, null, 0);
      expect(convertToJSON(data, 0)).toBe(expectedJSON);
    });

    it('should return an empty array as a JSON string if the input data is an empty array', () => {
      const data: object[] = [];
      expect(convertToJSON(data)).toBe('[]');
    });

    it('should throw an error if the input data is not an array', () => {
      // @ts-expect-error
      expect(() => convertToJSON("not an array")).toThrowError("Input data must be an array.");
    });

    it('should handle null and undefined values in JSON', () => {
      const data = [{ name: null, age: undefined }, { name: 'Jane Doe', age: 25 }];
      const expectedJSON = JSON.stringify(data, null, 2);
      expect(convertToJSON(data)).toBe(expectedJSON);
    });
  });

  describe('downloadData', () => {
    let createElementSpy: jest.SpyInstance;
    let appendChildSpy: jest.SpyInstance;
    let removeChildSpy: jest.SpyInstance;
    let createObjectURLSpy: jest.SpyInstance;
    let revokeObjectURLSpy: jest.SpyInstance;

    beforeEach(() => {
      createElementSpy = jest.spyOn(document, 'createElement');
      appendChildSpy = jest.spyOn(document.body, 'appendChild');
      removeChildSpy = jest.spyOn(document.body, 'removeChild');
      createObjectURLSpy = jest.spyOn(URL, 'createObjectURL');
      revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');

      createElementSpy.mockImplementation(() => {
        const a = {
          href: '',
          download: '',
          click: jest.fn(),
        };
        return a as any;
      });

      appendChildSpy.mockImplementation(() => {});
      removeChildSpy.mockImplementation(() => {});
      createObjectURLSpy.mockImplementation(() => 'mocked-url');
      revokeObjectURLSpy.mockImplementation(() => {});
    });

    afterEach(() => {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should initiate a download of data as a file', () => {
      const data = "Hello, world!";
      const filename = 'hello.txt';
      const mimeType = 'text/plain';

      downloadData(data, filename, mimeType);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      const aElement = createElementSpy.mock.results[0].value;
      expect(aElement.href).toBe('mocked-url');
      expect(aElement.download).toBe(filename);
      expect(aElement.click).toHaveBeenCalled();
    });
  });
});