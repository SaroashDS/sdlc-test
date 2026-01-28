import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { DashboardHeader, DashboardHeaderProps } from './DashboardHeader';

// Mock the CSS modules to prevent errors in the test environment
jest.mock('./DashboardHeader.module.css', () => ({
  header: 'header',
  title: 'title',
  actions: 'actions',
  dateFilterGroup: 'dateFilterGroup',
  dateFilterButton: 'dateFilterButton',
  active: 'active',
  exportButton: 'exportButton',
  icon: 'icon',
}));

const MOCK_CURRENT_DATE = new Date('2023-10-27T10:00:00.000Z');

describe('DashboardHeader', () => {
  let onDateChangeMock: jest.Mock;
  let onExportMock: jest.Mock;
  let defaultProps: DashboardHeaderProps;

  beforeAll(() => {
    // Lock the system time to ensure date calculations are deterministic
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_CURRENT_DATE);
  });

  afterAll(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Reset mocks before each test
    onDateChangeMock = jest.fn();
    onExportMock = jest.fn();
    defaultProps = {
      title: 'Sales Overview',
      onDateChange: onDateChangeMock,
      onExport: onExportMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props: Partial<DashboardHeaderProps> = {}) => {
    return render(<DashboardHeader {...defaultProps} {...props} />);
  };

  describe('Rendering and Initial State', () => {
    it('should render the title correctly', () => {
      renderComponent();
      expect(screen.getByRole('heading', { name: 'Sales Overview', level: 1 })).toBeInTheDocument();
    });

    it('should render all date preset buttons', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Last 7 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 30 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 90 Days' })).toBeInTheDocument();
    });

    it('should render the export button with text and an icon', () => {
      renderComponent();
      const exportButton = screen.getByRole('button', { name: 'Export' });
      expect(exportButton).toBeInTheDocument();
      expect(within(exportButton).getByText('Export')).toBeInTheDocument();
      // The icon has aria-hidden="true", so it's not accessible by role. We can check for its presence.
      expect(exportButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should apply the default active state to "Last 30 Days"', () => {
      renderComponent();
      const defaultActiveButton = screen.getByRole('button', { name: 'Last 30 Days' });
      expect(defaultActiveButton).toHaveClass('active');
      expect(defaultActiveButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onDateChange on initial render with the default date range', () => {
      renderComponent();
      expect(onDateChangeMock).toHaveBeenCalledTimes(1);

      const expectedEndDate = MOCK_CURRENT_DATE;
      const expectedStartDate = new Date(MOCK_CURRENT_DATE);
      expectedStartDate.setDate(expectedStartDate.getDate() - 30);

      expect(onDateChangeMock).toHaveBeenCalledWith({
        start: expectedStartDate,
        end: expectedEndDate,
      });
    });

    it('should apply a custom className to the header element', () => {
      const customClass = 'my-custom-header';
      renderComponent({ className: customClass });
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('header', customClass);
    });
  });

  describe('Props Handling', () => {
    it('should respect a custom defaultDatePresetId prop', () => {
      renderComponent({ defaultDatePresetId: 'last_7_days' });

      const activeButton = screen.getByRole('button', { name: 'Last 7 Days' });
      const inactiveButton = screen.getByRole('button', { name: 'Last 30 Days' });

      expect(activeButton).toHaveClass('active');
      expect(activeButton).toHaveAttribute('aria-pressed', 'true');
      expect(inactiveButton).not.toHaveClass('active');
      expect(inactiveButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should call onDateChange on initial render with the custom default date range', () => {
      renderComponent({ defaultDatePresetId: 'last_90_days' });
      expect(onDateChangeMock).toHaveBeenCalledTimes(1);

      const expectedEndDate = MOCK_CURRENT_DATE;
      const expectedStartDate = new Date(MOCK_CURRENT_DATE);
      expectedStartDate.setDate(expectedStartDate.getDate() - 90);

      expect(onDateChangeMock).toHaveBeenCalledWith({
        start: expectedStartDate,
        end: expectedEndDate,
      });
    });

    it('should fall back to "last_30_days" if an invalid defaultDatePresetId is provided', () => {
        renderComponent({ defaultDatePresetId: 'invalid_id' });
        const defaultActiveButton = screen.getByRole('button', { name: 'Last 30 Days' });
        expect(defaultActiveButton).toHaveClass('active');
        expect(defaultActiveButton).toHaveAttribute('aria-pressed', 'true');
        expect(onDateChangeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Interactions', () => {
    it('should call onExport when the export button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const exportButton = screen.getByRole('button', { name: 'Export' });
      await user.click(exportButton);

      expect(onExportMock).toHaveBeenCalledTimes(1);
    });

    it('should update the active preset and call onDateChange when a new date preset is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const last7DaysButton = screen.getByRole('button', { name: 'Last 7 Days' });
      const last30DaysButton = screen.getByRole('button', { name: 'Last 30 Days' });

      // Initial state check
      expect(last30DaysButton).toHaveClass('active');
      expect(last30DaysButton).toHaveAttribute('aria-pressed', 'true');
      expect(last7DaysButton).not.toHaveClass('active');
      expect(last7DaysButton).toHaveAttribute('aria-pressed', 'false');
      expect(onDateChangeMock).toHaveBeenCalledTimes(1); // From initial render

      // Click the 'Last 7 Days' button
      await user.click(last7DaysButton);

      // Check new state
      expect(last7DaysButton).toHaveClass('active');
      expect(last7DaysButton).toHaveAttribute('aria-pressed', 'true');
      expect(last30DaysButton).not.toHaveClass('active');
      expect(last30DaysButton).toHaveAttribute('aria-pressed', 'false');

      // Check if onDateChange was called again with the correct range
      expect(onDateChangeMock).toHaveBeenCalledTimes(2);
      const expectedEndDate = MOCK_CURRENT_DATE;
      const expectedStartDate = new Date(MOCK_CURRENT_DATE);
      expectedStartDate.setDate(expectedStartDate.getDate() - 7);
      expect(onDateChangeMock).toHaveBeenLastCalledWith({
        start: expectedStartDate,
        end: expectedEndDate,
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have a banner role for the header', () => {
      renderComponent();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have a group role for the date filter buttons with an accessible name', () => {
      renderComponent();
      expect(screen.getByRole('group', { name: 'Select date range' })).toBeInTheDocument();
    });

    it('should correctly set aria-pressed on date filter buttons', async () => {
      const user = userEvent.setup();
      renderComponent();

      const last7DaysButton = screen.getByRole('button', { name: 'Last 7 Days' });
      const last30DaysButton = screen.getByRole('button', { name: 'Last 30 Days' });

      expect(last30DaysButton).toHaveAttribute('aria-pressed', 'true');
      expect(last7DaysButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(last7DaysButton);

      expect(last30DaysButton).toHaveAttribute('aria-pressed', 'false');
      expect(last7DaysButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should hide the SVG icon from screen readers', () => {
        renderComponent();
        const exportButton = screen.getByRole('button', { name: 'Export' });
        const svgIcon = exportButton.querySelector('svg');
        expect(svgIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});