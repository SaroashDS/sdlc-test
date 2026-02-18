/**
 * @module export.util
 * @description Utility functions for exporting data.
 */

/**
 * @function convertToCSV
 * @description Converts an array of objects to a CSV string.
 * @param {object[]} data - The array of objects to convert.
 * @param {string[]} [headers] - Optional array of headers. If not provided, the keys of the first object will be used.
 * @param {string} [delimiter=","] - Optional delimiter to use. Defaults to comma.
 * @returns {string} A CSV string representation of the data.  Returns an empty string if data is empty or invalid.
 * @throws {Error} If data is not an array or contains non-object elements.
 *
 * @example
 * // Example usage:
 * const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
 * const csv = convertToCSV(data);
 * console.log(csv);
 * // Output:
 * // name,age
 * // John Doe,30
 * // Jane Doe,25
 *
 * @example
 * // Example with custom headers and delimiter:
 * const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
 * const headers = ['Name', 'Age'];
 * const csv = convertToCSV(data, headers, ';');
 * console.log(csv);
 * // Output:
 * // Name;Age
 * // John Doe;30
 * // Jane Doe;25
 *
 * @example
 * // Example with empty data:
 * const data: [] = [];
 * const csv = convertToCSV(data);
 * console.log(csv); // Output: ""
 *
 * @example
 * // Example with invalid data (non-object):
 * // @ts-expect-error
 * const data = [1, 2, 3];
 * try {
 *   convertToCSV(data);
 * } catch (error: any) {
 *   console.error(error.message); // Output: "Data must be an array of objects."
 * }
 */
export function convertToCSV(data: object[], headers?: string[], delimiter: string = ","): string {
  if (!Array.isArray(data)) {
    throw new Error("Data must be an array.");
  }

  if (data.length === 0) {
    return "";
  }

  if (!data.every(item => typeof item === 'object' && item !== null)) {
    throw new Error("Data must be an array of objects.");
  }

  const keys = headers || Object.keys(data[0]);

  if (!keys || keys.length === 0) {
    return "";
  }

  const headerRow = keys.join(delimiter);
  const dataRows = data.map(item => {
    return keys.map(key => {
      const value = (item as any)[key];
      if (typeof value === 'string') {
        // Escape double quotes by replacing them with two double quotes
        return `"${value.replace(/"/g, '""')}"`;
      } else if (value === null || value === undefined) {
        return "";
      } else {
        return String(value);
      }
    }).join(delimiter);
  });

  return [headerRow, ...dataRows].join('\n');
}


/**
 * @function convertToJSON
 * @description Converts an array of objects to a JSON string.
 * @param {object[]} data - The array of objects to convert.
 * @param {number} [indent=2] - Optional indentation level for the JSON string. Defaults to 2.
 * @returns {string} A JSON string representation of the data. Returns an empty string if data is empty.
 * @throws {Error} If data is not an array or contains non-object elements.
 *
 * @example
 * // Example usage:
 * const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
 * const json = convertToJSON(data);
 * console.log(json);
 * // Output:
 * // [
 * //   {
 * //     "name": "John Doe",
 * //     "age": 30
 * //   },
 * //   {
 * //     "name": "Jane Doe",
 * //     "age": 25
 * //   }
 * // ]
 *
 * @example
 * // Example with no indentation:
 * const data = [{ name: 'John Doe', age: 30 }, { name: 'Jane Doe', age: 25 }];
 * const json = convertToJSON(data, 0);
 * console.log(json);
 * // Output:
 * // [{"name":"John Doe","age":30},{"name":"Jane Doe","age":25}]
 *
 * @example
 * // Example with empty data:
 * const data: [] = [];
 * const json = convertToJSON(data);
 * console.log(json); // Output: "[]"
 *
 * @example
 * // Example with invalid data (non-object):
 * // @ts-expect-error
 * const data = [1, 2, 3];
 * try {
 *   convertToJSON(data);
 * } catch (error: any) {
 *   console.error(error.message); // Output: "Data must be an array of objects."
 * }
 */
export function convertToJSON(data: object[], indent: number = 2): string {
  if (!Array.isArray(data)) {
    throw new Error("Data must be an array.");
  }

  if (!data.every(item => typeof item === 'object' && item !== null)) {
    throw new Error("Data must be an array of objects.");
  }

  return JSON.stringify(data, null, indent);
}


/**
 * @function downloadData
 * @description Downloads data as a file.
 * @param {string} data - The data to download.
 * @param {string} filename - The name of the file to download.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {void}
 *
 * @example
 * // Example usage:
 * const data = 'Hello, world!';
 * downloadData(data, 'hello.txt', 'text/plain');
 * // This will trigger a download of a file named 'hello.txt' with the content 'Hello, world!'.
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