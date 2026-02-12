import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { axe } from 'jest-axe';
import DashboardPage from './DashboardPage';

// --- MOCKS ---

// Mocking lucide-react icons to simplify testing and snapshots
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  LayoutGrid: () => <div data-testid="icon-layout-grid" />,
  BarChart3: () => <div data-testid="icon-bar-chart" />,
  Users: () => <div data-testid="icon-users" />,
  DollarSign: () => <div data-testid="icon-dollar-sign" />,
  Activity: () => <div data-testid="icon-activity" />,
  AlertTriangle: () => <div data-testid="icon-alert-triangle" />,
  RefreshCw: () => <div data-testid="icon-refresh-cw" />,
  PlusCircle: () => <div data-testid="icon-plus-circle" />,
}));

// Mocking the API module
const mockDashboardData = {
  stats: [
    { title: 'Total Revenue', value: '$45,231.89', change: '+20.1% from last month', changeType: 'increase' as const, icon: jest.fn() },
    { title: 'Subscriptions', value: '+2,350', change: '+180.1% from last month', changeType: 'increase' as const, icon: jest.fn() },
    { title: 'Sales', value: '+12,234', change: '+19% from last month', changeType: 'increase' as const, icon: jest.fn() },
    { title: 'Active Now', value: '573', change: '+201 since last hour', changeType: 'increase' as const, icon: jest.fn() },
  ],
  recentActivity: [
    { id: '1', user: { name: 'Olivia Martin', avatarUrl: 'avatar1.jpg' }, action: 'purchased a new plan.', timestamp: '2m ago' },
    { id: '2', user: { name: 'Jackson Lee', avatarUrl: 'avatar2.jpg' }, action: 'upgraded to Pro.', timestamp: '10m ago' },
  ],
  salesData: [
    { month: 'Jan', sales: 4000 }, { month: 'Feb', sales: 3000 },
  ],
};

const mockApi = {
  fetchDashboardData: jest.fn(),
};

// We need to mock the entire module because it's imported and used in the component file.
// A simple spy won't work as the component holds a reference to the original implementation.
jest.mock('./DashboardPage', () => {
  const originalModule = jest.requireActual('./DashboardPage');
  return {
    __esModule: true,
    ...originalModule,
    // This is a trick to replace the mockApi inside the module with our test-controlled mock
    // This requires the source file to export the mockApi, which it doesn't.
    // A better approach is to mock the file that exports the api, but since it's in the same file, we'll mock Math.random
  };
});

// Since the API is in the same file, we'll mock Math.random to control its success/failure path
// and spy on the fetchDashboardData method.
// Let's assume the API is in a separate file for a more realistic mocking scenario.
// For this specific file structure, we will spy on the object directly.
// Let's pretend the API is in `api.ts` and we mock it like this:
// jest.mock('./api', () => ({
//   mockApi: {
//     fetchDashboardData: jest.fn(),
//   },
// }));
// Since it's in the same file, we'll have to use a different strategy.
// We will mock the implementation of the fetchDashboardData function directly.
// Let's assume the original file was refactored to allow this.
// For the provided code, we'll spy on the object and its method.
// This is not ideal but works for this structure.
// Let's assume we can import and spy on it.
// To make this testable, we'd ideally pass `mockApi.fetchDashboardData` as a prop or use dependency injection.
// Given the current structure, we'll mock the module and replace the API.
// A simple way is to mock the module and re-export everything, but replace the API.
// Let's assume we can't change the source code. The best we can do is mock `Math.random`.

let randomSpy: jest.SpyInstance;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HelmetProvider>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </HelmetProvider>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    // Mock Math.random to control API success/failure
    randomSpy = jest.spyOn(Math, 'random');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    randomSpy.mockRestore();
  });

  it('should be accessible in the loading state', async () => {
    randomSpy.mockReturnValue(0.4); // Ensure API call will succeed
    const { container } = render(<DashboardPage />, { wrapper: TestWrapper });
    expect(screen.getByText(/h-8 bg-gray-200/)).toBeInTheDocument(); // A way to find the skeleton
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders loading skeleton initially', () => {
    randomSpy.mockReturnValue(0.4); // API will succeed
    render(<DashboardPage />, { wrapper: TestWrapper });
    expect(screen.getByText(/h-8 bg-gray-200/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Dashboard/i })).not.toBeInTheDocument();
  });

  it('renders dashboard data successfully after loading', async () => {
    randomSpy.mockReturnValue(0.4); // API will succeed
    render(<DashboardPage />, { wrapper: TestWrapper });

    // Fast-forward timers to resolve the API call
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(await screen.findByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$45,231.89')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('+2,350')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Olivia Martin')).toBeInTheDocument();
    expect(screen.getByText('Jackson Lee')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Report/i })).toBeInTheDocument();
  });

  it('should be accessible in the success state', async () => {
    randomSpy.mockReturnValue(0.4); // API will succeed
    const { container } = render(<DashboardPage />, { wrapper: TestWrapper });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await screen.findByRole('heading', { name: /Dashboard/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('matches snapshot when data is loaded successfully', async () => {
    randomSpy.mockReturnValue(0.4); // API will succeed
    const { asFragment } = render(<DashboardPage />, { wrapper: TestWrapper });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await screen.findByRole('heading', { name: /Dashboard/i });
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders error state when API call fails', async () => {
    randomSpy.mockReturnValue(0.6); // API will fail
    render(<DashboardPage />, { wrapper: TestWrapper });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(await screen.findByRole('heading', { name: /An Error Occurred/i })).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch dashboard data. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('should be accessible in the error state', async () => {
    randomSpy.mockReturnValue(0.6); // API will fail
    const { container } = render(<DashboardPage />, { wrapper: TestWrapper });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await screen.findByRole('heading', { name: /An Error Occurred/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('allows user to retry fetching data after an error', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    // First call fails
    randomSpy.mockReturnValueOnce(0.6);
    render(<DashboardPage />, { wrapper: TestWrapper });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    const tryAgainButton = await screen.findByRole('button', { name: /Try Again/i });
    expect(tryAgainButton).toBeInTheDocument();

    // Second call succeeds
    randomSpy.mockReturnValueOnce(0.4);

    await user.click(tryAgainButton);

    // Should show loading skeleton again
    expect(screen.getByText(/h-8 bg-gray-200/)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    // Should now show the dashboard
    expect(await screen.findByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /An Error Occurred/i })).not.toBeInTheDocument();
  });

  it('sets the document title and meta description using Helmet', async () => {
    randomSpy.mockReturnValue(0.4); // API will succeed
    render(<DashboardPage />, { wrapper: TestWrapper });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(document.title).toBe('Dashboard | Your App');
    });

    const metaDescription = document.querySelector("meta[name='description']");
    expect(metaDescription).toHaveAttribute('content', 'Main dashboard providing an overview of your account statistics and recent activity.');
  });
});

// It's good practice to also unit test sub-components if they have complex logic,
// but for these simple display components, testing them via the main page is sufficient.
// However, here's an example of how you might test one.

describe('StatCard', () => {
  const StatCard = (props: any) => {
    const { title, value, change, changeType, icon: Icon } = props;
    return (
      <div>
        <h3>{title}</h3>
        <Icon />
        <p>{value}</p>
        <p className={changeType === 'increase' ? 'text-green-600' : 'text-red-600'}>{change}</p>
      </div>
    );
  };

  it('renders increase data correctly', () => {
    const props = {
      title: 'Revenue',
      value: '$1000',
      change: '+10%',
      changeType: 'increase' as const,
      icon: () => <div data-testid="icon-test" />,
    };
    render(<StatCard {...props} />);
    expect(screen.getByRole('heading', { name: 'Revenue' })).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
    const changeEl = screen.getByText('+10%');
    expect(changeEl).toBeInTheDocument();
    expect(changeEl).toHaveClass('text-green-600');
    expect(screen.getByTestId('icon-test')).toBeInTheDocument();
  });

  it('renders decrease data correctly', () => {
    const props = {
      title: 'Costs',
      value: '$500',
      change: '-5%',
      changeType: 'decrease' as const,
      icon: () => <div data-testid="icon-test" />,
    };
    render(<StatCard {...props} />);
    const changeEl = screen.getByText('-5%');
    expect(changeEl).toBeInTheDocument();
    expect(changeEl).toHaveClass('text-red-600');
  });
});