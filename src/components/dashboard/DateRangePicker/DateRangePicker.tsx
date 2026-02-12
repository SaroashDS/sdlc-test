import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import styles from './DateRangePicker.module.css';

// --- TYPE DEFINITIONS ---

interface DateRangePickerProps {
  /** The initially selected start date. */
  initialStartDate?: Date | null;
  /** The initially selected end date. */
  initialEndDate?: Date | null;
  /** Callback function triggered when the date range changes. */
  onChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  /** Accessible label for the date range picker input. */
  label: string;
  /** The date format for the input display. Defaults to 'MM/DD/YYYY'. */
  dateFormat?: string; // Note: For simplicity, we'll use a basic formatter. A library like date-fns would be used in a real app.
  /** The earliest selectable date. */
  minDate?: Date;
  /** The latest selectable date. */
  maxDate?: Date;
}

// --- HELPER FUNCTIONS ---

const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// --- CUSTOM HOOK ---

const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// --- ICONS ---

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);


// --- MAIN COMPONENT ---

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  initialStartDate = null,
  initialEndDate = null,
  onChange,
  label,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(initialStartDate || new Date());

  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(pickerRef, () => setIsOpen(false));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDateClick = useCallback((day: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (day < startDate) {
        setStartDate(day);
      } else {
        setEndDate(day);
        onChange({ startDate, endDate: day });
        setIsOpen(false);
      }
    }
  }, [startDate, endDate, onChange]);

  const changeMonth = (amount: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthDays = getDaysInMonth(year, month);
    const firstDayOfMonth = monthDays[0].getDay();

    const grid: (Date | null)[] = Array(firstDayOfMonth).fill(null);
    grid.push(...monthDays);

    return grid;
  }, [currentMonth]);

  const getDayClassName = (day: Date | null): string => {
    if (!day) return '';

    const classes = [styles.day];
    const time = day.getTime();

    const isSelected = (startDate && time === startDate.getTime()) || (endDate && time === endDate.getTime());
    const isStartDate = startDate && time === startDate.getTime();
    const isEndDate = endDate && time === endDate.getTime();
    const isInRange = startDate && endDate && time > startDate.getTime() && time < endDate.getTime();
    const isHoveringInRange = startDate && !endDate && hoverDate && time > startDate.getTime() && time <= hoverDate.getTime();
    const isToday = new Date().toDateString() === day.toDateString();
    const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate);

    if (isDisabled) classes.push(styles.disabled);
    if (isToday) classes.push(styles.today);
    if (isSelected) classes.push(styles.selected);
    if (isStartDate) classes.push(styles.startDate);
    if (isEndDate) classes.push(styles.endDate);
    if (isInRange || isHoveringInRange) classes.push(styles.inRange);

    return classes.join(' ');
  };

  const displayValue = `${formatDate(startDate)} - ${formatDate(endDate)}`;

  return (
    <div className={styles.container} ref={pickerRef}>
      <div className={styles.inputWrapper} onClick={() => setIsOpen(!isOpen)} role="button" aria-haspopup="dialog" aria-expanded={isOpen} aria-label={label}>
        <CalendarIcon />
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={displayValue}
          readOnly
          placeholder="Select a date range"
          aria-label="Selected date range"
        />
      </div>

      {isOpen && (
        <div className={styles.popover} role="dialog" aria-modal="true" aria-labelledby="date-range-picker-heading">
          <div className={styles.header}>
            <button onClick={() => changeMonth(-1)} className={styles.navButton} aria-label="Previous month">
              <ChevronLeftIcon />
            </button>
            <h2 id="date-range-picker-heading" aria-live="polite">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className={styles.navButton} aria-label="Next month">
              <ChevronRightIcon />
            </button>
          </div>
          <div className={styles.calendar}>
            <div className={styles.dayNames}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className={styles.dayGrid}>
              {calendarGrid.map((day, index) => (
                <div key={index} className={getDayClassName(day)}>
                  {day && (
                    <button
                      onClick={() => handleDateClick(day)}
                      onMouseEnter={() => setHoverDate(day)}
                      onMouseLeave={() => setHoverDate(null)}
                      disabled={(minDate && day < minDate) || (maxDate && day > maxDate)}
                      aria-pressed={!!((startDate && day.getTime() === startDate.getTime()) || (endDate && day.getTime() === endDate.getTime()))}
                      aria-disabled={(minDate && day < minDate) || (maxDate && day > maxDate)}
                      aria-label={day.toDateString()}
                    >
                      {day.getDate()}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};