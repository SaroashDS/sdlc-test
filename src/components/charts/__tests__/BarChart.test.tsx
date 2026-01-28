import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartData, ChartOptions } from 'chart.js';

import { BarChart, BarChartProps } from './BarChart';

// --- Mocks ---

// Mock the 'react-chartjs-2' library. We don't want to test the library itself,
// but rather that our component passes the correct props to it.
const mockBarComponent = jest.fn();
jest.mock('react-chartjs-2', () => ({
  Bar: (props: any) => {
    // Capture the props passed to the Bar component for later assertions
    mockBarComponent(props);
    // Render a placeholder with the necessary accessibility attributes
    return <canvas role={props.role} aria-label={props['aria-label']} data-testid="mock-chart-canvas" />;
  },
}));

// Mock React.useId to return a predictable value for consistent snapshot testing
// and attribute assertions.
jest.spyOn(React, 'useId').mockReturnValue('test-id-123');

// --- Test Setup ---

const mockDefaultChartData: ChartData<'bar'> = {
  labels: ['January', 'February', 'March', 'April', 'May'],
  datasets: [
    {
      label: 'Sales',
      data: [65, 59, 80, 81, 56],
      backgroundColor: 'rgba(75,192,192,0.4)',
      borderColor: 'rgba(75,192,192,1)',
      borderWidth: 1,
    },
    {
      label: 'Expenses',
      data: [28, 48, 40, 19, 86],
      backgroundColor: 'rgba(255,99,132,0.4)',
      borderColor: 'rgba(255,99,132,1)',
      borderWidth: 1,
    },
  ],
};

const defaultProps: BarChartProps = {
  data: mockDefaultChartData,
  title: 'Monthly Performance',
  ariaLabel: 'A bar chart showing monthly performance data for sales and expenses.',
};

const renderComponent = (props: Partial<BarChartProps> = {}) => {
  return render(<BarChart {...defaultProps} {...props} />);
};

describe('BarChart', () => {
  beforeEach(() => {
    // Clear mock calls before each test to ensure a clean state
    mockBarComponent.mockClear();
  });

  describe('Basic Rendering and Props', () => {
    it('should render the chart container and title', () => {
      renderComponent();
      expect(screen.getByRole('figure')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Monthly Performance' })).toBeInTheDocument();
    });

    it('should render the mock Bar component', () => {
      renderComponent();
      expect(screen.getByTestId('mock-chart-canvas')).toBeInTheDocument();
      expect(mockBarComponent).toHaveBeenCalledTimes(1);
    });

    it('should pass the correct data prop to the Bar component', () => {
      renderComponent();
      expect(mockBarComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockDefaultChartData,
        })
      );
    });

    it('should apply a custom className to the container', () => {
      const customClass = 'my-custom-chart-class';
      renderComponent({ className: customClass });
      const container = screen.getByRole('figure');
      expect(container).toHaveClass('chartContainer'); // from module CSS
      expect(container).toHaveClass(customClass);
    });

    it('should not add "undefined" to className when the prop is omitted', () => {
        renderComponent();
        const container = screen.getByRole('figure');
        // The class name should be exactly 'chartContainer' (or whatever the module CSS hashes it to)
        // and should not contain the string "undefined".
        expect(container.className).not.toContain('undefined');
        expect(container).toHaveClass('chartContainer');
    });
  });

  describe('Chart Options Merging', () => {
    it('should use default options when no custom options are provided', () => {
      renderComponent();
      const passedOptions = mockBarComponent.mock.calls[0][0].options;

      // Check a few key default options
      expect(passedOptions.responsive).toBe(true);
      expect(passedOptions.maintainAspectRatio).toBe(false);
      expect(passedOptions.plugins.legend.position).toBe('top');
      expect(passedOptions.plugins.title.display).toBe(false);
      expect(passedOptions.scales.y.beginAtZero).toBe(true);
    });

    it('should merge custom options, overriding defaults where specified', () => {
      const customOptions: ChartOptions<'bar'> = {
        responsive: false, // Override default
        plugins: {
          legend: {
            position: 'bottom', // Override default
          },
          tooltip: {
            enabled: false, // Add new
          },
        },
      };

      renderComponent({ options: customOptions });
      const passedOptions = mockBarComponent.mock.calls[0][0].options;

      // Check that custom options took precedence
      expect(passedOptions.responsive).toBe(false);
      expect(passedOptions.plugins.legend.position).toBe('bottom');
      expect(passedOptions.plugins.tooltip.enabled).toBe(false);

      // Check that other default options are still present
      expect(passedOptions.maintainAspectRatio).toBe(false);
      expect(passedOptions.plugins.title.display).toBe(false);
      expect(passedOptions.scales.x.grid.display).toBe(false);
    });

    it('should deeply merge nested options correctly', () => {
        const customOptions: ChartOptions<'bar'> = {
            scales: {
                y: {
                    beginAtZero: false, // Override nested property
                    ticks: {
                        color: 'red', // Override deeper nested property
                    }
                }
            }
        };

        renderComponent({ options: customOptions });
        const passedOptions = mockBarComponent.mock.calls[0][0].options;

        // Check overridden nested properties
        expect(passedOptions.scales.y.beginAtZero).toBe(false);
        expect(passedOptions.scales.y.ticks.color).toBe('red');

        // Check that other nested properties from defaults are preserved
        expect(passedOptions.scales.y.grid.color).toBe('rgba(255, 255, 255, 0.15)');
        expect(passedOptions.scales.x.ticks.color).toBe('rgba(255, 255, 255, 0.7)');
    });
  });

  describe('Accessibility', () => {
    it('should have a container with role="figure"', () => {
      renderComponent();
      expect(screen.getByRole('figure')).toBeInTheDocument();
    });

    it('should link the figure container to the title via aria-labelledby', () => {
      renderComponent();
      const figure = screen.getByRole('figure');
      const heading = screen.getByRole('heading', { name: defaultProps.title });

      // Check that the heading has the predictable ID from our mock
      expect(heading).toHaveAttribute('id', 'barchart-title-test-id-123');
      // Check that the figure is labelled by this ID
      expect(figure).toHaveAttribute('aria-labelledby', 'barchart-title-test-id-123');
    });

    it('should pass the correct role and aria-label to the underlying chart element', () => {
      renderComponent();
      const chartCanvas = screen.getByTestId('mock-chart-canvas');

      expect(chartCanvas).toHaveAttribute('role', 'img');
      expect(chartCanvas).toHaveAttribute('aria-label', defaultProps.ariaLabel);

      // Also verify via the mock's props
      expect(mockBarComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'img',
          'aria-label': defaultProps.ariaLabel,
        })
      );
    });

    it('should allow finding the chart via its accessible name', () => {
        renderComponent();
        // This query combines role and accessible name, which is a great accessibility check.
        const chart = screen.getByRole('img', { name: defaultProps.ariaLabel });
        expect(chart).toBeInTheDocument();
    });
  });
});