/**
 * @module exportUtils
 * @description Utilities for exporting data in various formats.
 */

/**
 * @function convertToCSV
 * @description Converts an array of objects to a CSV string.
 * @param {object[]} data - The array of objects to convert.
 * @param {string} [delimiter=','] - The delimiter to use between fields. Defaults to comma (,).
 * @param {string[]} [fields] - An optional array of field names to include in the CSV. If not provided, all keys from the first object will be used.
 * @returns {string} A CSV string representation of the data. Returns an empty string if the input data is invalid.
 * @throws {Error} If the input data is not an array or if the array is empty.
 *
 * @example
 * // Example usage:
 * const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
 * const csvString = convertToCSV(data);
 * console.log(csvString); // Output: "name,age\nJohn Doe,30\nJane Doe,25\n"
 *
 * @example
 * // Example usage with custom delimiter:
 * const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
 * const csvString = convertToCSV(data, ';');
 * console.log(csvString); // Output: "name;age\nJohn Doe;30\nJane Doe;25\n"
 *
 * @example
 * // Example usage with specific fields:
 * const data = [{ name: 'John Doe', age: 30, city: 'New York' }, { name: 'Jane Doe', age: 25, city: 'London' }];
 * const csvString = convertToCSV(data, ',', ['name', 'age']);
 * console.log(csvString); // Output: "name,age\nJohn Doe,30\nJane Doe,25\n"
 *
 * @example
 * // Example usage with empty data:
 * const data: object[] = [];
 * const csvString = convertToCSV(data);
 * console.log(csvString); // Output: ""
 *
 * @example
 * // Example usage with invalid data (not an array):
 * // @ts-expect-error
 * const csvString = convertToCSV("not an array"); // Throws Error
 */
export function convertToCSV(data: object[], delimiter: string = ',', fields?: string[]): string {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array.");
  }

  if (data.length === 0) {
    return "";
  }

  const keys = fields || Object.keys(data[0]);

  if (!keys || keys.length === 0) {
    return "";
  }

  const header = keys.join(delimiter);
  const rows = data.map(obj => {
    return keys.map(key => {
      const value = (obj as any)[key];
      if (value === null || value === undefined) {
        return '';
      }
      return String(value).replace(/"/g, '""'); // Escape double quotes
    }).join(delimiter);
  });

  return `${header}\n${rows.join('\n')}`;
}

/**
 * @function convertToJSON
 * @description Converts an array of objects to a JSON string.
 * @param {object[]} data - The array of objects to convert.
 * @param {number} [indent=2] - The number of spaces to use for indentation. Defaults to 2.
 * @returns {string} A JSON string representation of the data. Returns an empty string if the input data is invalid.
 * @throws {Error} If the input data is not an array.
 *
 * @example
 * // Example usage:
 * const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
 * const jsonString = convertToJSON(data);
 * console.log(jsonString); // Output: "[\n  {\n    \"name\": \"John Doe\",\n    \"age\": 30\n  },\n  {\n    \"name\": \"Jane Doe\",\n    \"age\": 25\n  }\n]"
 *
 * @example
 * // Example usage with no indentation:
 * const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
 * const jsonString = convertToJSON(data, 0);
 * console.log(jsonString); // Output: "[{\"name\":\"John Doe\",\"age\":30},{\"name\":\"Jane Doe\",\"age\":25}]"
 *
 * @example
 * // Example usage with empty data:
 * const data: object[] = [];
 * const jsonString = convertToJSON(data);
 * console.log(jsonString); // Output: "[]"
 *
 * @example
 * // Example usage with invalid data (not an array):
 * // @ts-expect-error
 * const jsonString = convertToJSON("not an array"); // Throws Error
 */
export function convertToJSON(data: object[], indent: number = 2): string {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array.");
  }

  return JSON.stringify(data, null, indent);
}

/**
 * @function downloadData
 * @description Initiates a download of data as a file.
 * @param {string} data - The data to download.
 * @param {string} filename - The name of the file to download.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {void}
 *
 * @example
 * // Example usage:
 * const data = "Hello, world!";
 * downloadData(data, 'hello.txt', 'text/plain');
 */
export function downloadData(data: string, filename: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}