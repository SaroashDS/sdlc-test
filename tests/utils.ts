// test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './src/app/store'; // Adjust path as needed
import theme from './src/theme'; // Adjust path as needed
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: Providers, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };

// Mock Data Utilities
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});

export const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-1',
  name: 'Test Product',
  price: 10,
  description: 'Test Description',
  imageUrl: 'test.jpg',
  ...overrides,
});

// Common Test Helpers
export const findByRoleWithin = async (container: HTMLElement, role: string, name: string) => {
  return await screen.findByRole(role, { name: name }, { container: container });
};

export const waitForLoadingToFinish = async () => {
  await screen.findByText('Loading...');
  await screen.findByText('Done!');
};

// Mock Factories
export const mockUserFactory = (overrides: Partial<User> = {}): User => ({
  id: `user-${Math.random()}`,
  name: 'Mock User',
  email: `mock@example.com`,
  ...overrides,
});

export const mockProductFactory = (overrides: Partial<Product> = {}): Product => ({
  id: `product-${Math.random()}`,
  name: 'Mock Product',
  price: Math.random() * 100,
  description: 'Mock Description',
  imageUrl: 'mock.jpg',
  ...overrides,
});

// Test Data Generators
export const generateUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => mockUserFactory({ id: `user-${i}` }));
};

export const generateProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => mockProductFactory({ id: `product-${i}` }));
};

// User Event
export const user = userEvent.setup();

// Accessibility helpers
export const checkAccessibility = async (container: HTMLElement) => {
  // Implement accessibility checks here, e.g., using axe-core
  // Example:
  // const axeResults = await new AxeBuilder({ element: container }).analyze();
  // expect(axeResults.violations).toEqual([]);
};

// Types (Adjust to your actual types)
interface User {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}