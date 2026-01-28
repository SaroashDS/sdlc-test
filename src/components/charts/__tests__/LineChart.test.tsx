import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LineChart, LineChartProps } from './LineChart';
import { ChartData, ChartOptions } from 'chart.js';

// Mock the 'react-chartjs-2' library
// We create a mock 'Line' component to inspect the props passed to it.
const mockLineComponent = jest.fn((props) => <canvas data-testid="mock-line-chart" />);
jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => mockLineComponent(props),
}));

// Mock ChartJS.register to prevent errors in test environment and focus on component logic
jest.mock('chart.js', () => {
  const originalModule = jest.requireActual('chart.js');
  return {
    ...originalModule,
    Chart: {
      ...originalModule.Chart,
      register: jest.fn(),
    },
    // Mocking individual components that are registered
    CategoryScale: jest.fn(),
    LinearScale: jest.fn(),
    PointElement: jest.fn(),
    LineElement: jest.fn(),
    Title: jest.fn(),
    Tooltip: jest.fn(),
    Legend: jest.fn(),
    Filler: jest.fn(),
  };
});

// Mock Math.random for consistent and predictable ID generation in tests
const MOCK_RANDOM_VALUE = 0.123456789;
const mockMath = Object.create(global.Math);
mockMath.random = () => MOCK_RANDOM_VALUE;
global.Math = mockMath;
const expectedChartTitleId = `line-chart-title-${MOCK_RANDOM_VALUE.toString(36).substr(2, 9)}`;

// Sample data for the chart, conforming to the ChartData type
const mockChartData: ChartData<'line'> = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Sales',
      data: [12, 19, 3, 5, 2, 3],
      fill: true,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
    },
  ],
};

const defaultProps: LineChartProps = {
  data: mockChartData,
};

describe('LineChart', () => {
  beforeEach(() => {
    // Clear mock calls before each test to ensure test isolation
    mockLineComponent.mockClear();
  });

  it('renders the chart container and the mock Line component', () => {
    render(<LineChart {...defaultProps} />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('passes the data prop correctly to the Line component', () => {
    render(<LineChart {...defaultProps} />);
    expect(mockLineComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockChartData,
      }),
      {}
    );
  });

  describe('Header and Titles', () => {
    it('renders both title and subtitle when provided', () => {
      render(<LineChart {...defaultProps} title="Sales Data" subtitle="Last 6 months" />);
      expect(screen.getByRole('heading', { name: 'Sales Data', level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Last 6 months')).toBeInTheDocument();
    });

    it('renders only the title when only title is provided', () => {
      render(<LineChart {...defaultProps} title="Sales Data" />);
      expect(screen.getByRole('heading', { name: 'Sales Data', level: 2 })).toBeInTheDocument();
      expect(screen.queryByText('Last 6 months')).not.toBeInTheDocument();
    });

    it('renders only the subtitle when only subtitle is provided', () => {
      render(<LineChart {...defaultProps} subtitle="Last 6 months" />);
      expect(screen.getByText('Last 6 months')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('does not render the header when no title or subtitle is provided', () => {
      render(<LineChart {...defaultProps} />);
      // <header> element is not present
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('Styling and ClassNames', () => {
    it('applies the default wrapper class', () => {
      const { container } = render(<LineChart {...defaultProps} />);
      // CSS modules transform class names; the mock returns the name as-is.
      expect(container.firstChild).toHaveClass('wrapper');
    });

    it('applies a custom className alongside the default one', () => {
      const { container } = render(<LineChart {...defaultProps} className="my-custom-chart" />);
      expect(container.firstChild).toHaveClass('wrapper', 'my-custom-chart');
    });
  });

  describe('Chart Options Merging', () => {
    it('uses default options when no custom options are provided', () => {
      render(<LineChart {...defaultProps} />);
      const passedOptions = mockLineComponent.mock.calls[0][0].options;

      // Check a few key default options to ensure they are applied
      expect(passedOptions.responsive).toBe(true);
      expect(passedOptions.plugins.legend.position).toBe('top');
      expect(passedOptions.plugins.title.display).toBe(false);
      expect(passedOptions.scales.x.grid.display).toBe(false);
      expect(passedOptions.elements.line.tension).toBe(0.4);
    });

    it('merges custom top-level options with defaults', () => {
      const customOptions: ChartOptions<'line'> = {
        responsive: false,
        maintainAspectRatio: true,
      };
      render(<LineChart {...defaultProps} options={customOptions} />);
      const passedOptions = mockLineComponent.mock.calls[0][0].options;

      expect(passedOptions.responsive).toBe(false); // Overridden
      expect(passedOptions.maintainAspectRatio).toBe(true); // Overridden
      expect(passedOptions.plugins.legend.position).toBe('top'); // Default preserved
    });

    it('merges custom plugin options with defaults', () => {
      const customOptions: ChartOptions<'line'> = {
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            enabled: false,
          },
        },
      };
      render(<LineChart {...defaultProps} options={customOptions} />);
      const passedOptions = mockLineComponent.mock.calls[0][0].options;

      // Check overridden plugin options
      expect(passedOptions.plugins.legend.position).toBe('bottom');
      expect(passedOptions.plugins.tooltip.enabled).toBe(false);

      // Check that other default plugin options are preserved
      expect(passedOptions.plugins.legend.align).toBe('end');
      expect(passedOptions.plugins.title.display).toBe(false);
    });

    it('merges custom scale options with defaults', () => {
      const customOptions: ChartOptions<'line'> = {
        scales: {
          y: {
            display: false,
          },
          x: {
            ticks: {
              color: 'red',
            },
          },
        },
      };
      render(<LineChart {...defaultProps} options={customOptions} />);
      const passedOptions = mockLineComponent.mock.calls[0][0].options;

      // Check overridden scale options
      expect(passedOptions.scales.y.display).toBe(false);
      expect(passedOptions.scales.x.ticks.color).toBe('red');

      // Check that other default scale options are preserved
      expect(passedOptions.scales.x.grid.display).toBe(false);
      expect(passedOptions.scales.y.grid.drawTicks).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('applies aria-labelledby to the section when a title is provided', () => {
      render(<LineChart {...defaultProps} title="Sales Data" />);
      // A <section> with an accessible name has a role of 'region'
      const section = screen.getByRole('region', { name: 'Sales Data' });
      const title = screen.getByRole('heading', { name: 'Sales Data' });

      expect(title).toHaveAttribute('id', expectedChartTitleId);
      expect(section).toHaveAttribute('aria-labelledby', expectedChartTitleId);
    });

    it('does not apply aria-labelledby when no title is provided', () => {
      render(<LineChart {...defaultProps} subtitle="A subtitle without a title" />);
      // A <section> without an accessible name does not have a 'region' role by default
      const { container } = render(<LineChart {...defaultProps} />);
      const section = container.querySelector('section');
      expect(section).not.toHaveAttribute('aria-labelledby');
    });
  });
});