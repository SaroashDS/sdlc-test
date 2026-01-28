// DashboardHeader.tsx

import React, { useState, useMemo } from 'react';
import styles from './DashboardHeader.module.css';

// --- TYPE DEFINITIONS ---

/** Defines the structure for a date range. */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/** Props for the DashboardHeader component. */
export interface DashboardHeaderProps {
  /** The main title to be displayed in the header. */
  title: string;
  /** Optional initial date range to set the component's state. */
  initialDateRange?: DateRange;
  /** Callback function triggered when the date range is updated. */
  onDateChange?: (newRange: DateRange) => void;
  /** Callback function triggered when the export button is clicked. */
  onExport?: () => void;
}

// --- SVG ICONS ---
// In a real-world scenario, these would likely come from an icon library.
// Defining them here keeps the component self-contained.

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ExportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);


// --- HELPER FUNCTIONS ---

/**
 * Formats a date range into a user-friendly string.
 * e.g., "Jan 1, 2023 - Jan 31, 2023"
 */
const formatDateRange = (range: DateRange): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  const startDate = range.startDate.toLocaleDateString('en-US', options);
  const endDate = range.endDate.toLocaleDateString('en-US', options);
  return `${startDate} - ${endDate}`;
};

// --- DEFAULT STATE ---

const getDefaultDateRange = (): DateRange => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  return { startDate, endDate };
};


/**
 * A sophisticated header for dashboard pages, featuring a title,
 * a date range selector, and an export action button.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  initialDateRange,
  onDateChange,
  onExport,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange || getDefaultDateRange()
  );

  // Memoize the formatted date string to avoid re-computation on every render.
  const formattedDate = useMemo(() => formatDateRange(dateRange), [dateRange]);

  const handleDateFilterClick = () => {
    // In a real application, this would open a calendar/date picker modal.
    // For this example, we'll just log to the console.
    console.log('Date range filter clicked. Current range:', dateRange);
    // The `onDateChange` prop would be called from the date picker's "apply" action.
  };

  const handleExportClick = () => {
    console.log('Exporting data...');
    onExport?.();
  };

  return (
    <header className={styles.header} role="banner">
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.dateRangePicker}
          onClick={handleDateFilterClick}
          aria-label={`Change date range. Current range: ${formattedDate}`}
        >
          <CalendarIcon />
          <span>{formattedDate}</span>
        </button>
        <button
          type="button"
          className={styles.exportButton}
          onClick={handleExportClick}
          aria-label="Export data"
        >
          <ExportIcon />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

// Set default props for better reusability and clarity.
DashboardHeader.defaultProps = {
  title: 'Dashboard',
};