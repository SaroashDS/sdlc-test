import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalyticsChart, AnalyticsChartProps } from './AnalyticsChart';
import { TooltipProps } from 'recharts';

// --- MOCK DATA ---

const mockData = [
  { timestamp: 1672531200000, revenue: 12000, users: 150 }, // Jan 1, 2023
  { timestamp: 1672617600000, revenue: 18000, users: 180 }, // Jan 2, 2023
  { timestamp: 1672704000000, revenue: 15000, users: 210 }, // Jan 3, 2023
];

const defaultProps: AnalyticsChartProps = {
  data: mockData,
  dataKey: 'revenue',
  title: 'Revenue Over Time',
};

// --- MOCKING RECHARTS ---

/**
 * Recharts components rely on browser APIs like ResizeObserver and render complex SVGs,
 * which are not supported or are difficult to test in a JSDOM environment.
 * We mock the entire library to:
 * 1. Prevent errors from JSDOM's limitations.
 * 2. Isolate our component's logic for testing.
 * 3. Assert that our component passes the correct props to the Recharts components.
 *
 * Each mock component renders a simple div with a data-testid and passes through props,
 * allowing us to inspect them in our tests.
 */
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  // We need the original TooltipProps type, but everything else is mocked.
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    AreaChart: ({ children, data, 'aria-label': ariaLabel }: { children: React.ReactNode; data: any[], 'aria-label': string }) => (
      <div data-testid="area-chart" data-chart-data={JSON.stringify(data)} aria-label={ariaLabel}>
        {children}
      </div>
    ),
    Area: (props: any) => <div data-testid="area-component" {...props} />,
    XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
    YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
    CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
    Tooltip: ({ content }: { content: React.ReactElement }) => (
      <div data-testid="tooltip" data-content-component-name={content?.type.name} />
    ),
    defs: ({ children }: { children: React.ReactNode }) => <div data-testid="defs">{children}</div>,
    linearGradient: (props: any) => <div data-testid="linear-gradient" {...props} />,
    stop: (props: any) => <div data-testid="stop" {...props} />,
  };
});

// To test the CustomTooltip, we need to extract it. In a real-world scenario,
// you would export it from the component file for testing.
// We are dynamically extracting it here for the purpose of this example.
let CustomTooltip: React.FC<TooltipProps<number, string>>;
jest.isolateModules(() => {
  const { AnalyticsChart } = require('./AnalyticsChart');
  // This is a workaround to access the un-exported CustomTooltip.
  // In a real project, it's better to export it for testing.
  const { Tooltip } = require('recharts');
  render(<AnalyticsChart {...defaultProps} />);
  const tooltipInstance = Tooltip.mock.calls[0][0];
  CustomTooltip = tooltipInstance.content.type;
});


describe('AnalyticsChart', () => {
  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
  });

  describe('Rendering and Props', () => {
    it('renders the chart with required props', () => {
      render(<AnalyticsChart {...defaultProps} />);

      // Check for accessibility and semantic structure
      const figure = screen.getByRole('figure', { name: `Analytics chart titled: ${defaultProps.title}` });
      expect(figure).toBeInTheDocument();

      // Check for title
      const figcaption = screen.getByText(defaultProps.title);
      expect(figcaption.tagName).toBe('FIGCAPTION');

      // Check that the chart container is rendered
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toHaveAttribute('aria-label', `Area chart showing ${defaultProps.dataKey} over time`);
    });

    it('renders the empty state when data is an empty array', () => {
      render(<AnalyticsChart {...defaultProps} data={[]} />);

      expect(screen.getByText('No data available to display.')).toBeInTheDocument();
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });

    it('renders the empty state when data is not provided', () => {
      render(<AnalyticsChart {...defaultProps} data={undefined as any} />);

      expect(screen.getByText('No data available to display.')).toBeInTheDocument();
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });

    it('applies a custom className to the container', () => {
      const customClass = 'my-custom-chart';
      render(<AnalyticsChart {...defaultProps} className={customClass} />);

      const figure = screen.getByRole('figure');
      expect(figure).toHaveClass('container', customClass);
    });
  });

  describe('Recharts Configuration', () => {
    it('passes the correct data to the AreaChart component', () => {
      render(<AnalyticsChart {...defaultProps} />);
      const areaChart = screen.getByTestId('area-chart');
      expect(areaChart).toHaveAttribute('data-chart-data', JSON.stringify(mockData));
    });

    it('configures the Area component with the correct dataKey and default color', () => {
      render(<AnalyticsChart {...defaultProps} />);
      const area = screen.getByTestId('area-component');

      expect(area).toHaveAttribute('dataKey', 'revenue');
      expect(area).toHaveAttribute('type', 'monotone');
      expect(area).toHaveAttribute('stroke', '#8884d8'); // Default color
      expect(area).toHaveAttribute('name', 'Revenue'); // Capitalized dataKey
      expect(area).toHaveAttribute('fill', expect.stringContaining('url(#chart-gradient-'));
    });

    it('configures the Area component with a custom chartColor', () => {
      const customColor = '#1abc9c';
      render(<AnalyticsChart {...defaultProps} chartColor={customColor} />);
      const area = screen.getByTestId('area-component');

      expect(area).toHaveAttribute('stroke', customColor);
    });

    it('configures the gradient stops with the correct color', () => {
      const customColor = '#e74c3c';
      render(<AnalyticsChart {...defaultProps} chartColor={customColor} />);

      const stops = screen.getAllByTestId('stop');
      expect(stops[0]).toHaveAttribute('stopColor', customColor);
      expect(stops[1]).toHaveAttribute('stopColor', customColor);
    });

    it('configures the XAxis and YAxis correctly', () => {
      render(<AnalyticsChart {...defaultProps} />);

      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis).toHaveAttribute('dataKey', 'timestamp');

      // YAxis has no dataKey prop in this implementation
      const yAxis = screen.getByTestId('y-axis');
      expect(yAxis).toBeInTheDocument();
    });

    it('uses the CustomTooltip component for the Tooltip content', () => {
      render(<AnalyticsChart {...defaultProps} />);
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toHaveAttribute('data-content-component-name', 'CustomTooltip');
    });
  });
});

describe('CustomTooltip', () => {
  it('renders correctly when active with a valid payload', () => {
    const tooltipProps: TooltipProps<number, string> = {
      active: true,
      payload: [
        {
          name: 'Revenue',
          value: 123456,
          payload: { timestamp: 1672531200000, revenue: 123456 },
        },
      ],
      label: 1672531200000, // Jan 1, 2023
    };

    render(<CustomTooltip {...tooltipProps} />);

    expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument();
    expect(screen.getByText(/Revenue:/i)).toBeInTheDocument();
    // Check for locale-formatted number
    expect(screen.getByText('123,456')).toBeInTheDocument();
  });

  it('returns null when not active', () => {
    const tooltipProps: TooltipProps<number, string> = {
      active: false,
      payload: [
        {
          name: 'Revenue',
          value: 123456,
          payload: { timestamp: 1672531200000, revenue: 123456 },
        },
      ],
      label: 1672531200000,
    };

    const { container } = render(<CustomTooltip {...tooltipProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when payload is empty', () => {
    const tooltipProps: TooltipProps<number, string> = {
      active: true,
      payload: [],
      label: 1672531200000,
    };

    const { container } = render(<CustomTooltip {...tooltipProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when payload is undefined', () => {
    const tooltipProps: TooltipProps<number, string> = {
      active: true,
      payload: undefined,
      label: 1672531200000,
    };

    const { container } = render(<CustomTooltip {...tooltipProps} />);
    expect(container.firstChild).toBeNull();
  });
});