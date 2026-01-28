import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, startOfDay } from 'date-fns';
import { DateRangePicker, DateRangePickerProps } from './DateRangePicker';

// Mock the CSS module to prevent errors and allow class name checks
jest.mock('./DateRangePicker.module.css', () => ({
  container: 'container',
  trigger: 'trigger',
  popover: 'popover',
  calendar: 'calendar',
  header: 'header',
  navButton: 'navButton',
  monthYear: 'monthYear',
  weekdays: 'weekdays',
  weekday: 'weekday',
  daysGrid: 'daysGrid',
  day: 'day',
  disabled: 'disabled',
  today: 'today',
  startDate: 'startDate',
  endDate: 'endDate',
  singleDate: 'singleDate',
  inRange: 'inRange',
  inHoverRange: 'inHoverRange',
  hoverDate: 'hoverDate',
}));

const mockToday = new Date('2023-10-15T12:00:00.000Z');

describe('DateRangePicker', () => {
  let onChangeMock: jest.Mock;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockToday);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    onChangeMock = jest.fn();
  });

  const renderComponent = (props: Partial<DateRangePickerProps> = {}) => {
    const defaultProps: DateRangePickerProps = {
      onChange: onChangeMock,
    };
    return render(<DateRangePicker {...defaultProps} {...props} />);
  };

  const getTrigger = () => screen.getByRole('button', { name: /select date range/i });

  it('renders with default placeholder text', () => {
    renderComponent();
    expect(getTrigger()).toHaveTextContent('Select a date range');
  });

  it('renders with a custom label', () => {
    renderComponent({ label: 'Choose your dates' });
    expect(screen.getByRole('button', { name: /choose your dates/i })).toBeInTheDocument();
  });

  it('renders with a custom className', () => {
    const { container } = renderComponent({ className: 'my-custom-class' });
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('renders with an initial date range', () => {
    const startDate = new Date('2023-10-10');
    const endDate = new Date('2023-10-20');
    renderComponent({ initialRange: { startDate, endDate } });
    const expectedText = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    expect(getTrigger()).toHaveTextContent(expectedText);
  });

  describe('Popover Interactions', () => {
    it('opens the popover on trigger click', async () => {
      renderComponent();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await userEvent.click(getTrigger());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes the popover on second trigger click', async () => {
      renderComponent();
      await userEvent.click(getTrigger());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await userEvent.click(getTrigger());
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes the popover on clicking outside', async () => {
      renderComponent();
      await userEvent.click(getTrigger());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await userEvent.click(document.body);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the popover on Escape key press', async () => {
      renderComponent();
      await userEvent.click(getTrigger());
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      await userEvent.keyboard('{escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('manages focus correctly when opening and closing', async () => {
        renderComponent();
        const trigger = getTrigger();
        expect(trigger).not.toHaveFocus();
      
        await userEvent.click(trigger);
        const dialog = screen.getByRole('dialog');
        const calendar = within(dialog).getByRole('grid').parentElement;
        expect(calendar).toHaveFocus();
      
        await userEvent.keyboard('{escape}');
        expect(dialog).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
      });
  });

  describe('Date Selection', () => {
    it('selects a start date and updates the trigger text', async () => {
      renderComponent();
      await userEvent.click(getTrigger());
      const day10 = screen.getByRole('gridcell', { name: 'October 10, 2023' });
      await userEvent.click(day10);
      expect(getTrigger()).toHaveTextContent('Oct 10, 2023 - ...');
      expect(onChangeMock).not.toHaveBeenCalled();
    });

    it('selects a start and end date, calls onChange, and closes', async () => {
      renderComponent();
      await userEvent.click(getTrigger());
      const day10 = screen.getByRole('gridcell', { name: 'October 10, 2023' });
      const day20 = screen.getByRole('gridcell', { name: 'October 20, 2023' });

      await userEvent.click(day10);
      await userEvent.click(day20);

      const expectedStartDate = startOfDay(new Date('2023-10-10'));
      const expectedEndDate = startOfDay(new Date('2023-10-20'));

      expect(onChangeMock).toHaveBeenCalledTimes(1);
      expect(onChangeMock).toHaveBeenCalledWith({
        startDate: expectedStartDate,
        endDate: expectedEndDate,
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('swaps dates if end date is selected before start date', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        const day20 = screen.getByRole('gridcell', { name: 'October 20, 2023' });
        const day10 = screen.getByRole('gridcell', { name: 'October 10, 2023' });
  
        await userEvent.click(day20); // Select start date
        await userEvent.click(day10); // Select end date (before start)
  
        const expectedStartDate = startOfDay(new Date('2023-10-10'));
        const expectedEndDate = startOfDay(new Date('2023-10-20'));
  
        expect(onChangeMock).toHaveBeenCalledWith({
          startDate: expectedStartDate,
          endDate: expectedEndDate,
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

    it('starts a new selection if a date is clicked when a range is already complete', async () => {
      const startDate = new Date('2023-10-10');
      const endDate = new Date('2023-10-20');
      renderComponent({ initialRange: { startDate, endDate } });

      await userEvent.click(getTrigger());
      const day12 = screen.getByRole('gridcell', { name: 'October 12, 2023' });
      await userEvent.click(day12);

      expect(getTrigger()).toHaveTextContent('Oct 12, 2023 - ...');
      expect(onChangeMock).not.toHaveBeenCalled();
    });

    it('highlights the date range correctly', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        const day10 = screen.getByRole('gridcell', { name: 'October 10, 2023' });
        const day15 = screen.getByRole('gridcell', { name: 'October 15, 2023' });
        const day20 = screen.getByRole('gridcell', { name: 'October 20, 2023' });
  
        await userEvent.click(day10);
        await userEvent.click(day20);
        
        // Re-open to check classes
        await userEvent.click(getTrigger());

        expect(screen.getByRole('gridcell', { name: 'October 10, 2023' })).toHaveClass('startDate');
        expect(screen.getByRole('gridcell', { name: 'October 20, 2023' })).toHaveClass('endDate');
        expect(screen.getByRole('gridcell', { name: 'October 15, 2023' })).toHaveClass('inRange');
      });

      it('highlights the hover range correctly', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        const day10 = screen.getByRole('gridcell', { name: 'October 10, 2023' });
        const day12 = screen.getByRole('gridcell', { name: 'October 12, 2023' });
        const day15 = screen.getByRole('gridcell', { name: 'October 15, 2023' });
  
        await userEvent.click(day10);
        await userEvent.hover(day15);
  
        expect(day12).toHaveClass('inHoverRange');
        expect(day15).toHaveClass('hoverDate');
  
        await userEvent.unhover(day15);
        expect(day12).not.toHaveClass('inHoverRange');
        expect(day15).not.toHaveClass('hoverDate');
      });

      it('highlights today\'s date', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        const todayCell = screen.getByRole('gridcell', { name: 'October 15, 2023' });
        expect(todayCell).toHaveClass('today');
      });
  });

  describe('Navigation', () => {
    it('navigates to the next month', async () => {
      renderComponent();
      await userEvent.click(getTrigger());
      expect(screen.getByText('October 2023')).toBeInTheDocument();
      
      const nextButton = screen.getByRole('button', { name: 'Next month' });
      await userEvent.click(nextButton);
      
      expect(screen.getByText('November 2023')).toBeInTheDocument();
    });

    it('navigates to the previous month', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        expect(screen.getByText('October 2023')).toBeInTheDocument();
        
        const prevButton = screen.getByRole('button', { name: 'Previous month' });
        await userEvent.click(prevButton);
        
        expect(screen.getByText('September 2023')).toBeInTheDocument();
      });
  });

  describe('minDate and maxDate props', () => {
    const minDate = new Date('2023-10-05');
    const maxDate = new Date('2023-10-25');

    it('disables dates before minDate', async () => {
        renderComponent({ minDate });
        await userEvent.click(getTrigger());
        const day4 = screen.getByRole('gridcell', { name: 'October 4, 2023' });
        const day5 = screen.getByRole('gridcell', { name: 'October 5, 2023' });
        
        expect(day4).toBeDisabled();
        expect(day4).toHaveClass('disabled');
        expect(day5).not.toBeDisabled();
    });

    it('disables dates after maxDate', async () => {
        renderComponent({ maxDate });
        await userEvent.click(getTrigger());
        const day25 = screen.getByRole('gridcell', { name: 'October 25, 2023' });
        const day26 = screen.getByRole('gridcell', { name: 'October 26, 2023' });
        
        expect(day25).not.toBeDisabled();
        expect(day26).toBeDisabled();
        expect(day26).toHaveClass('disabled');
    });

    it('does not allow selecting a disabled date', async () => {
        renderComponent({ minDate });
        await userEvent.click(getTrigger());
        const day4 = screen.getByRole('gridcell', { name: 'October 4, 2023' });
        
        await userEvent.click(day4);
        
        expect(getTrigger()).toHaveTextContent('Select a date range');
        expect(onChangeMock).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes on the trigger', async () => {
        renderComponent();
        const trigger = getTrigger();
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        
        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has a descriptive aria-label on the trigger', () => {
        const startDate = new Date('2023-10-10');
        const endDate = new Date('2023-10-20');
        renderComponent({ initialRange: { startDate, endDate }, label: 'Booking dates' });
        const expectedLabel = 'Booking dates: Oct 10, 2023 - Oct 20, 2023';
        expect(screen.getByRole('button', { name: expectedLabel })).toBeInTheDocument();
    });

    it('has correct ARIA attributes on the popover dialog', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-label', 'Date range selection dialog');
    });

    it('has correct ARIA attributes on navigation buttons', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
    });

    it('has aria-live region for the month/year display', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        const monthYear = screen.getByText('October 2023');
        expect(monthYear).toHaveAttribute('aria-live', 'polite');
    });

    it('has correct roles for calendar grid structure', async () => {
        renderComponent();
        await userEvent.click(getTrigger());
        expect(screen.getByRole('grid')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader').length).toBe(7);
        expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(27);
    });

    it('has correct ARIA attributes on day buttons', async () => {
        const startDate = new Date('2023-10-10');
        renderComponent({ initialRange: { startDate, endDate: null } });
        await userEvent.click(getTrigger());
        
        const day10 = screen.getByRole('gridcell', { name: 'October 10, 2023' });
        const day11 = screen.getByRole('gridcell', { name: 'October 11, 2023' });

        expect(day10).toHaveAttribute('aria-pressed', 'true');
        expect(day11).toHaveAttribute('aria-pressed', 'false');
    });
  });
});