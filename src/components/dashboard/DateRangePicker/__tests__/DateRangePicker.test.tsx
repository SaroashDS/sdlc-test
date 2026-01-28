import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateRangePicker } from './DateRangePicker';

// Mock CSS modules to return class names as is, allowing us to test for their presence.
jest.mock('./DateRangePicker.module.css', () => new Proxy({}, {
  get: (target, prop) => prop,
}));

describe('DateRangePicker', () => {
  const mockOnChange = jest.fn();
  // Set a fixed date to make tests deterministic
  const mockToday = new Date('2023-10-15T12:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockToday);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const getDayButton = (day: number | string) => {
    // Find all buttons with the day number, as days from other months might be visible
    const dayButtons = screen.getAllByRole('button', { name: new RegExp(` ${day}, `) });
    // Return the one that is not disabled (i.e., belongs to the current month)
    return dayButtons.find(button => !(button as HTMLButtonElement).disabled);
  };

  describe('Initial Rendering and Display', () => {
    it('renders with no dates selected', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      const trigger = screen.getByRole('button', { name: /Selected date range/ });
      expect(trigger).toHaveTextContent('Select a date range');
      expect(trigger).toHaveAttribute('aria-label', 'Selected date range: Select a date range');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with only a start date selected', () => {
      const startDate = new Date('2023-10-10');
      render(<DateRangePicker value={{ startDate, endDate: null }} onChange={mockOnChange} />);
      const trigger = screen.getByRole('button', { name: /Selected date range/ });
      expect(trigger).toHaveTextContent('Oct 10, 2023 - Select end date');
      expect(trigger).toHaveAttribute('aria-label', 'Selected date range: Oct 10, 2023 - Select end date');
    });

    it('renders with a full date range selected', () => {
      const startDate = new Date('2023-10-10');
      const endDate = new Date('2023-10-20');
      render(<DateRangePicker value={{ startDate, endDate }} onChange={mockOnChange} />);
      const trigger = screen.getByRole('button', { name: /Selected date range/ });
      expect(trigger).toHaveTextContent('Oct 10, 2023 - Oct 20, 2023');
      expect(trigger).toHaveAttribute('aria-label', 'Selected date range: Oct 10, 2023 - Oct 20, 2023');
    });
  });

  describe('Popover Interaction', () => {
    it('opens and closes the popover on trigger click', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      const trigger = screen.getByRole('button', { name: /Selected date range/ });

      // Open
      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeVisible();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Close
      fireEvent.click(trigger);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes the popover on an outside click', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      const trigger = screen.getByRole('button', { name: /Selected date range/ });

      // Open
      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeVisible();

      // Click outside
      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Calendar Navigation', () => {
    it('opens to the current month if no start date is provided', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));
      expect(screen.getByText('October 2023')).toBeVisible();
    });

    it('opens to the month of the start date if provided', () => {
      const startDate = new Date('2022-05-10');
      render(<DateRangePicker value={{ startDate, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));
      expect(screen.getByText('May 2022')).toBeVisible();
    });

    it('navigates to the next month', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));
      
      expect(screen.getByText('October 2023')).toBeVisible();
      
      const nextButton = screen.getByRole('button', { name: 'Next month' });
      fireEvent.click(nextButton);
      
      expect(screen.getByText('November 2023')).toBeVisible();
    });

    it('navigates to the previous month', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      expect(screen.getByText('October 2023')).toBeVisible();

      const prevButton = screen.getByRole('button', { name: 'Previous month' });
      fireEvent.click(prevButton);

      expect(screen.getByText('September 2023')).toBeVisible();
    });
  });

  describe('Date Selection Logic', () => {
    it('selects a start date', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      const day15 = getDayButton(15);
      fireEvent.click(day15!);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2023-10-15T00:00:00.000Z'),
        endDate: null,
      });
      // Popover should remain open
      expect(screen.getByRole('dialog')).toBeVisible();
    });

    it('selects an end date after the start date', () => {
      const startDate = new Date('2023-10-10');
      render(<DateRangePicker value={{ startDate, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      const day20 = getDayButton(20);
      fireEvent.click(day20!);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith({
        startDate,
        endDate: new Date('2023-10-20T00:00:00.000Z'),
      });
      // Popover should close after selecting end date
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('selects an end date before the start date, swapping them', () => {
      const startDate = new Date('2023-10-20');
      render(<DateRangePicker value={{ startDate, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      const day10 = getDayButton(10);
      fireEvent.click(day10!);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2023-10-10T00:00:00.000Z'),
        endDate: startDate,
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('resets the selection when a date is clicked with a full range already selected', () => {
      const startDate = new Date('2023-10-10');
      const endDate = new Date('2023-10-20');
      render(<DateRangePicker value={{ startDate, endDate }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      const day5 = getDayButton(5);
      fireEvent.click(day5!);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2023-10-05T00:00:00.000Z'),
        endDate: null,
      });
      expect(screen.getByRole('dialog')).toBeVisible();
    });
  });

  describe('UI States and Styling', () => {
    it('applies correct classes for selected start and end dates', () => {
      const startDate = new Date('2023-10-10');
      const endDate = new Date('2023-10-20');
      render(<DateRangePicker value={{ startDate, endDate }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      expect(getDayButton(10)).toHaveClass('isSelectedStart');
      expect(getDayButton(20)).toHaveClass('isSelectedEnd');
    });

    it('applies correct class for dates within the selected range', () => {
      const startDate = new Date('2023-10-10');
      const endDate = new Date('2023-10-20');
      render(<DateRangePicker value={{ startDate, endDate }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      expect(getDayButton(15)).toHaveClass('isInRange');
      expect(getDayButton(19)).toHaveClass('isInRange');
      expect(getDayButton(9)).not.toHaveClass('isInRange');
      expect(getDayButton(21)).not.toHaveClass('isInRange');
    });

    it('highlights the range on hover when selecting an end date', () => {
      const startDate = new Date('2023-10-10');
      render(<DateRangePicker value={{ startDate, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      const day18 = getDayButton(18);
      fireEvent.mouseEnter(day18!);

      expect(day18).toHaveClass('isHovered');
      expect(getDayButton(15)).toHaveClass('isInRange');
      expect(getDayButton(11)).toHaveClass('isInRange');

      fireEvent.mouseLeave(day18!);
      expect(day18).not.toHaveClass('isHovered');
      expect(getDayButton(15)).not.toHaveClass('isInRange');
    });

    it('disables and styles days outside the current month', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ })); // Opens on Oct 2023

      // October 1st is a Sunday, so no previous month days are shown in the first row.
      // Let's navigate to a month that has them.
      fireEvent.click(screen.getByRole('button', { name: 'Next month' })); // Nov 2023
      
      const dialog = screen.getByRole('dialog');
      // October 31st should be visible but disabled
      const prevMonthDay = within(dialog).getByRole('button', { name: /October 31/ });
      expect(prevMonthDay).toBeDisabled();
      expect(prevMonthDay).toHaveClass('isOutsideMonth');

      // December 2nd should be visible but disabled
      const nextMonthDay = within(dialog).getByRole('button', { name: /December 2/ });
      expect(nextMonthDay).toBeDisabled();
      expect(nextMonthDay).toHaveClass('isOutsideMonth');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria attributes on the trigger', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      const trigger = screen.getByRole('button', { name: /Selected date range/ });
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has correct roles and labels on the popover and its controls', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Date range selection calendar');

      expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
    });

    it('has descriptive aria-labels for each day button', () => {
      render(<DateRangePicker value={{ startDate: null, endDate: null }} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Selected date range/ }));

      // Mocked date is Sunday, Oct 15, 2023
      const day15 = getDayButton(15);
      expect(day15).toHaveAttribute('aria-label', 'Sunday, October 15, 2023');

      const day16 = getDayButton(16);
      expect(day16).toHaveAttribute('aria-label', 'Monday, October 16, 2023');
    });
  });
});