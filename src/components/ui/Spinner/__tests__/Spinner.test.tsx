import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

import { Spinner } from './Spinner';
import styles from './Spinner.module.css';

// Extend Jest's expect with jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Spinner Component', () => {
  describe('Rendering and Default Props', () => {
    it('should render the spinner with default props', () => {
      render(<Spinner />);
      
      // The component should be identifiable by its role="status"
      const spinnerElement = screen.getByRole('status');
      expect(spinnerElement).toBeInTheDocument();

      // It should have the default accessible name
      expect(spinnerElement).toHaveAccessibleName('Loading...');
    });

    it('should apply default CSS classes', () => {
      render(<Spinner />);
      const spinnerElement = screen.getByRole('status');

      // Check for base and default size class from CSS modules
      expect(spinnerElement).toHaveClass(styles.spinner);
      expect(spinnerElement).toHaveClass(styles.medium);
    });

    it('should render the visually hidden label text', () => {
        render(<Spinner />);
        const labelElement = screen.getByText('Loading...');
        expect(labelElement).toBeInTheDocument();
        expect(labelElement).toHaveClass(styles.visuallyHidden);
    });
  });

  describe('Prop Combinations', () => {
    // Test each size variant
    it.each([
      ['small' as const],
      ['medium' as const],
      ['large' as const],
    ])('should render with size="%s"', (size) => {
      render(<Spinner size={size} />);
      const spinnerElement = screen.getByRole('status');
      expect(spinnerElement).toHaveClass(styles[size]);
    });

    it('should render with a custom label', () => {
      const customLabel = 'Processing data...';
      render(<Spinner label={customLabel} />);
      
      const spinnerElement = screen.getByRole('status');
      expect(spinnerElement).toHaveAccessibleName(customLabel);

      // Also verify the text content of the visually hidden span
      const labelElement = screen.getByText(customLabel);
      expect(labelElement).toBeInTheDocument();
    });

    it('should accept and apply a custom className', () => {
      const customClass = 'my-custom-spinner';
      render(<Spinner className={customClass} />);
      
      const spinnerElement = screen.getByRole('status');
      expect(spinnerElement).toHaveClass(styles.spinner);
      expect(spinnerElement).toHaveClass(styles.medium); // Default size class
      expect(spinnerElement).toHaveClass(customClass);
    });

    it('should handle an empty className prop gracefully', () => {
        render(<Spinner className="" />);
        const spinnerElement = screen.getByRole('status');
        // The class attribute should not contain extra spaces
        expect(spinnerElement.className.trim()).toBe(`${styles.spinner} ${styles.medium}`);
    });

    it('should render correctly with all custom props combined', () => {
      const customLabel = 'Finalizing...';
      const customClass = 'finalizing-spinner';
      const size = 'large';

      render(<Spinner size={size} label={customLabel} className={customClass} />);
      
      const spinnerElement = screen.getByRole('status');
      
      // Check accessible name
      expect(spinnerElement).toHaveAccessibleName(customLabel);
      
      // Check all classes
      expect(spinnerElement).toHaveClass(styles.spinner);
      expect(spinnerElement).toHaveClass(styles[size]);
      expect(spinnerElement).toHaveClass(customClass);

      // Ensure other size classes are not present
      expect(spinnerElement).not.toHaveClass(styles.small);
      expect(spinnerElement).not.toHaveClass(styles.medium);
    });
  });

  describe('Accessibility', () => {
    it('should have the correct ARIA attributes for accessibility', () => {
      render(<Spinner />);
      const spinnerElement = screen.getByRole('status');
      
      // role="status" implicitly sets aria-live="polite" and aria-atomic="true"
      // We explicitly check for the role and aria-live attribute set in the component
      expect(spinnerElement).toHaveAttribute('role', 'status');
      expect(spinnerElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should not have any accessibility violations with default props', async () => {
      const { container } = render(<Spinner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have any accessibility violations with custom props', async () => {
      const { container } = render(
        <Spinner size="large" label="Loading content, please wait." />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});