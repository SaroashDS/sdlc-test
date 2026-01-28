// jest.setup.ts

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure React Testing Library
configure({ testIdAttribute: 'data-testid' });

// Global test utilities (example)
global.wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock common modules (example - adjust as needed)
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: () => new Promise(() => {}) },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Test environment setup (example - adjust as needed)
process.env.NODE_ENV = 'test';

// Custom matchers (example - adjust as needed)
expect.extend({
  toBeVisible(element: HTMLElement) {
    const pass = element.offsetParent !== null;
    if (pass) {
      return {
        message: () =>
          `expected ${element.tagName} not to be visible`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${element.tagName} to be visible`,
        pass: false,
      };
    }
  },
});

// Cleanup after each test
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});