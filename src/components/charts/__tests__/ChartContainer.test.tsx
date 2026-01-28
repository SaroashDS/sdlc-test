import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartContainer, type ChartContainerProps } from './ChartContainer';

// Mock CSS modules to prevent errors during testing
jest.mock('./ChartContainer.module.css', () => ({
  container: 'mock-container',
  header: 'mock-header',
  title: 'mock-title',
  actions: 'mock-actions',
  content: 'mock-content',
  stateOverlay: 'mock-stateOverlay',
  spinner: 'mock-spinner',
  errorIconWrapper: 'mock-errorIconWrapper',
  errorIcon: 'mock-errorIcon',
  errorMessage: 'mock-errorMessage',
}));

describe('ChartContainer', () => {
  const defaultProps: ChartContainerProps = {
    title: 'Sales Over Time',
    children: <div>Chart Content Here</div>,
  };

  describe('Default Rendering', () => {
    it('should render the title and children correctly', () => {
      render(<ChartContainer {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /sales over time/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Chart Content Here')).toBeInTheDocument();
    });

    it('should render the actions slot when provided', () => {
      const actions = <button>Export Data</button>;
      render(<ChartContainer {...defaultProps} actions={actions} />);

      expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument();
    });

    it('should not render the actions container when actions are not provided', () => {
      render(<ChartContainer {...defaultProps} />);
      const header = screen.getByRole('banner'); // <header> has a banner role
      // The header should only contain the h2 title element
      expect(header.children.length).toBe(1);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should apply a custom className to the root element', () => {
      const customClass = 'my-custom-chart-container';
      render(<ChartContainer {...defaultProps} className={customClass} />);

      const container = screen.getByRole('region', { name: defaultProps.title });
      expect(container).toHaveClass('mock-container');
      expect(container).toHaveClass(customClass);
    });
  });

  describe('State Handling', () => {
    describe('when isLoading is true', () => {
      it('should display a loading spinner and accessible text', () => {
        render(<ChartContainer {...defaultProps} isLoading />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
        // Check for the spinner element by its mocked class
        const statusOverlay = screen.getByRole('status');
        expect(statusOverlay.querySelector('.mock-spinner')).toBeInTheDocument();
      });

      it('should not render the children content', () => {
        render(<ChartContainer {...defaultProps} isLoading />);
        expect(screen.queryByText('Chart Content Here')).not.toBeInTheDocument();
      });

      it('should still render the header with title and actions', () => {
        const actions = <button>Cancel</button>;
        render(<ChartContainer {...defaultProps} isLoading actions={actions} />);

        expect(screen.getByRole('heading', { name: defaultProps.title, level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    describe('when an error is provided', () => {
      const errorMessage = 'Failed to fetch chart data.';

      it('should display an error message and icon', () => {
        render(<ChartContainer {...defaultProps} error={errorMessage} />);

        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(alert.querySelector('svg')).toBeInTheDocument();
      });

      it('should not render the children content', () => {
        render(<ChartContainer {...defaultProps} error={errorMessage} />);
        expect(screen.queryByText('Chart Content Here')).not.toBeInTheDocument();
      });

      it('should not render the loading spinner', () => {
        render(<ChartContainer {...defaultProps} error={errorMessage} />);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should prioritize the loading state over the error state', () => {
      const errorMessage = 'This error should not be displayed.';
      render(<ChartContainer {...defaultProps} isLoading error={errorMessage} />);

      // Assert loading state is present
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading chart data...')).toBeInTheDocument();

      // Assert error state is absent
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have a root element with role="region"', () => {
      render(<ChartContainer {...defaultProps} />);
      expect(screen.getByRole('region', { name: defaultProps.title })).toBeInTheDocument();
    });

    it('should link the region to the title via aria-labelledby', () => {
      render(<ChartContainer {...defaultProps} />);
      const region = screen.getByRole('region');
      const heading = screen.getByRole('heading', { name: defaultProps.title, level: 2 });

      expect(heading).toHaveAttribute('id');
      const headingId = heading.getAttribute('id');
      expect(headingId).not.toBeNull();
      expect(region).toHaveAttribute('aria-labelledby', headingId);
    });

    it('should set aria-busy="true" when loading', () => {
      render(<ChartContainer {...defaultProps} isLoading />);
      expect(screen.getByRole('region', { name: defaultProps.title })).toHaveAttribute('aria-busy', 'true');
    });

    it('should set aria-busy="false" when not loading', () => {
      render(<ChartContainer {...defaultProps} />);
      expect(screen.getByRole('region', { name: defaultProps.title })).toHaveAttribute('aria-busy', 'false');
    });

    it('should have role="status" and aria-live="polite" for the loading state', () => {
      render(<ChartContainer {...defaultProps} isLoading />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have role="alert" for the error state', () => {
      render(<ChartContainer {...defaultProps} error="An error occurred" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow interaction with elements passed into the actions slot', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      const actions = <button onClick={handleClick}>Refresh</button>;

      render(<ChartContainer {...defaultProps} actions={actions} />);

      const button = screen.getByRole('button', { name: /refresh/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Prop Edge Cases', () => {
    it('should handle an empty string title', () => {
      render(<ChartContainer title="" children={<div>Content</div>} />);
      // The heading should still render for aria-labelledby to work, even if empty
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toBeEmptyDOMElement();
    });

    it('should handle a null error prop without crashing', () => {
      render(<ChartContainer {...defaultProps} error={null} />);
      expect(screen.getByText('Chart Content Here')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle an undefined className prop without adding "undefined" to classList', () => {
      const { container } = render(<ChartContainer {...defaultProps} className={undefined} />);
      // The root element is the first child of the testing-library container
      expect(container.firstChild).toHaveClass('mock-container');
      expect(container.firstChild).not.toHaveClass('undefined');
    });
  });
});