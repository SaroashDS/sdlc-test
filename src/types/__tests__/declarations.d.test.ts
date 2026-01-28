/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

// --- Mock Imports ---
// These imports rely on Jest's `moduleNameMapper` configuration to resolve.
// The purpose of these tests is not to check the runtime behavior of these modules,
// but to verify that TypeScript correctly applies the types from `declarations.d.ts`.
// The test file itself serves as a type-checking mechanism.

// Mocked CSS/SCSS/SASS modules
import cssStyles from './__mocks__/test.module.css';
import scssStyles from './__mocks__/test.module.scss';
import sassStyles from './__mocks__/test.module.sass';

// Mocked static assets
import pngUrl from './__mocks__/test.png';
import jpgUrl from './__mocks__/test.jpg';
import jpegUrl from './__mocks__/test.jpeg';
import gifUrl from './__mocks__/test.gif';
import webpUrl from './__mocks__/test.webp';
import svgUrl, { ReactComponent as SvgComponent } from './__mocks__/test.svg';


/**
 * NOTE ON TESTING DECLARATION FILES (.d.ts):
 *
 * This test file is designed to validate the TypeScript type declarations in `declarations.d.ts`.
 * Since declaration files contain no runtime code, we cannot test their "logic".
 * Instead, we test them by writing code that *uses* these types.
 *
 * If this test file compiles without TypeScript errors, it means the declarations are working correctly.
 * The runtime assertions (e.g., `expect(...)`) are secondary; they primarily confirm that the
 * Jest mocking setup is functioning as expected.
 *
 * For these tests to run, your `jest.config.js` needs a `moduleNameMapper` like this:
 *
 * module.exports = {
 *   // ... other config
 *   moduleNameMapper: {
 *     // For CSS/SCSS/SASS Modules
 *     '\\.(css|scss|sass)$': 'identity-obj-proxy',
 *
 *     // For SVG component imports
 *     '\\.svg$': '<rootDir>/path/to/svgMock.js', // A mock that exports a default string and a ReactComponent
 *
 *     // For other static assets
 *     '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/path/to/fileMock.js', // A mock that exports a string
 *   },
 * };
 *
 */

describe('Global Type Declarations (declarations.d.ts)', () => {

  describe('CSS Modules', () => {
    it('should correctly type *.module.css imports', () => {
      // Type Check: Ensure the imported object has string keys and string values.
      const myClass: string = cssStyles.myClass;
      const anotherClass: string = cssStyles['another-class'];

      // Runtime Check: Verify the mock is working (using identity-obj-proxy).
      expect(myClass).toBe('myClass');
      expect(anotherClass).toBe('another-class');
      expect(typeof cssStyles).toBe('object');
    });

    it('should correctly type *.module.scss imports', () => {
      // Type Check
      const myClass: string = scssStyles.myScssClass;

      // Runtime Check
      expect(myClass).toBe('myScssClass');
      expect(typeof scssStyles).toBe('object');
    });

    it('should correctly type *.module.sass imports', () => {
      // Type Check
      const myClass: string = sassStyles.mySassClass;

      // Runtime Check
      expect(myClass).toBe('mySassClass');
      expect(typeof sassStyles).toBe('object');
    });
  });

  describe('Static Assets', () => {
    it('should correctly type *.svg imports for default and named exports', () => {
      // Type Check: Default import should be a string.
      const url: string = svgUrl;

      // Type Check: ReactComponent should be a valid React Function Component.
      const Component: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = SvgComponent;

      // Runtime Check: Verify the mock values.
      expect(typeof url).toBe('string');
      // The actual value depends on the mock file.
      expect(url).toBe('test.svg');
      expect(typeof Component).toBe('function');
    });

    it('should render the mocked SVG ReactComponent', () => {
      render(<SvgComponent data-testid="mock-svg" title="Mock SVG" />);
      const svgElement = screen.getByTestId('mock-svg');
      
      // Runtime Check: Ensure the mocked component renders something.
      // The exact output depends on your SVG mock implementation.
      expect(svgElement).toBeInTheDocument();
      expect(svgElement.tagName.toLowerCase()).toBe('svg');
    });

    it.each([
      ['.png', pngUrl],
      ['.jpg', jpgUrl],
      ['.jpeg', jpegUrl],
      ['.gif', gifUrl],
      ['.webp', webpUrl],
    ])('should correctly type %s imports as a string', (ext, url) => {
      // Type Check: The variable `url` is already typed as `any` by the `it.each`
      // signature, but we can re-assign to a typed variable to confirm.
      const path: string = url;

      // Runtime Check: Verify the mock is a string.
      expect(typeof path).toBe('string');
      // The actual value depends on the mock file.
      expect(path).toBe(`test${ext}`);
    });
  });

  describe('Global Namespace Augmentation', () => {

    describe('NodeJS.ProcessEnv', () => {
      const originalEnv = process.env;

      beforeEach(() => {
        jest.resetModules();
        process.env = {
          ...originalEnv,
          NODE_ENV: 'test',
          VITE_API_BASE_URL: 'https://api.example.com',
        };
      });

      afterAll(() => {
        process.env = originalEnv;
      });

      it('should provide types for NODE_ENV', () => {
        // Type Check: This assignment would fail if NODE_ENV was not typed correctly.
        const env: 'development' | 'production' | 'test' = process.env.NODE_ENV;

        // Runtime Check
        expect(env).toBe('test');
      });

      it('should provide types for custom environment variables', () => {
        // Type Check: This assignment would fail if VITE_API_BASE_URL was not a string.
        const apiUrl: string = process.env.VITE_API_BASE_URL;

        // Runtime Check
        expect(apiUrl).toBe('https://api.example.com');
      });

      it('should result in a type error for undefined variables', () => {
        // Type Check: The following line should show a TypeScript error in your IDE
        // because `UNDEFINED_VAR` is not in the `ProcessEnv` interface.
        // We use @ts-expect-error to assert that this error is expected.
        // @ts-expect-error This property is not defined in our types.
        const undefinedVar = process.env.UNDEFINED_VAR;

        // Runtime Check
        expect(undefinedVar).toBeUndefined();
      });
    });

    describe('Window Interface', () => {
        it('should allow augmenting the global Window object (if declarations were active)', () => {
            // The example `__MY_APP_CONFIG__` is commented out in the .d.ts file.
            // If it were active, the following code would type-check correctly.
            
            /*
            // Type Check: This demonstrates how the augmentation would be tested.
            // TypeScript would know the shape of this custom property.
            interface MyAppConfig {
                readonly apiEndpoint: string;
                readonly featureFlags: Record<string, boolean>;
            }

            const config: MyAppConfig = {
                apiEndpoint: '/api/v1',
                featureFlags: { newDashboard: true },
            };

            // This assignment would be type-safe.
            window.__MY_APP_CONFIG__ = config;

            // This would cause a type error:
            // window.__MY_APP_CONFIG__ = { apiEndpoint: 123 };
            */

            // Since there are no active declarations, we just add a placeholder test.
            expect(window).toBeDefined();
        });
    });
  });
});