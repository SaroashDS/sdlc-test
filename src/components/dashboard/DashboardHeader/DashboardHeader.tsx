import React, { useState, useMemo } from 'react';
import styles from './DashboardHeader.module.css';

// --- TYPE DEFINITIONS ---

/**
 * Defines the structure for a date range object.
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Defines the available presets for the date filter.
 * 'id' is a unique identifier.
 * 'label' is the display text for the button.
 * 'getRange' is a function that returns a calculated DateRange.
 */
type DatePreset = {
  id: string;
  label: string;
  getRange: () => DateRange;
};

/**
 * Props for the DashboardHeader component.
 */
export interface DashboardHeaderProps {
  /** The main title to be displayed in the header. */
  title: string;
  /** The default selected date preset ID. */
  defaultDatePresetId?: string;
  /** Callback function triggered when the date range is changed. */
  onDateChange: (range: DateRange) => void;
  /** Callback function triggered when the export button is clicked. */
  onExport: () => void;
  /** Optional additional CSS class for custom styling. */
  className?: string;
}

// --- HELPER CONSTANTS & FUNCTIONS ---

const datePresets: DatePreset[] = [
  {
    id: 'last_7_days',
    label: 'Last 7 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      return { start, end };
    },
  },
  {
    id: 'last_30_days',
    label: 'Last 30 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      return { start, end };
    },
  },
  {
    id: 'last_90_days',
    label: 'Last 90 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 90);
      return { start, end };
    },
  },
];

/**
 * A simple utility to conditionally join class names.
 * @param classes - An array of strings or falsy values.
 * @returns A single string of space-separated class names.
 */
const cx = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

// --- SVG ICON COMPONENT ---

const ExportIcon = () => (
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
    className={styles.icon}
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// --- MAIN COMPONENT ---

/**
 * A premium header component for a dashboard, featuring a title,
 * date range filters, and an export action.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  defaultDatePresetId = 'last_30_days',
  onDateChange,
  onExport,
  className,
}) => {
  const [activePresetId, setActivePresetId] = useState<string>(defaultDatePresetId);

  // Memoize the initial date range call to avoid re-running on every render.
  useMemo(() => {
    const initialPreset = datePresets.find(p => p.id === defaultDatePresetId) || datePresets[1];
    if (initialPreset) {
      onDateChange(initialPreset.getRange());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultDatePresetId]); // Only runs when the default preset changes.

  const handlePresetClick = (preset: DatePreset) => {
    setActivePresetId(preset.id);
    onDateChange(preset.getRange());
  };

  return (
    <header className={cx(styles.header, className)} role="banner">
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.actions} aria-label="Dashboard actions">
        <div className={styles.dateFilterGroup} role="group" aria-label="Select date range">
          {datePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={cx(styles.dateFilterButton, activePresetId === preset.id && styles.active)}
              onClick={() => handlePresetClick(preset)}
              aria-pressed={activePresetId === preset.id}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <button type="button" className={styles.exportButton} onClick={onExport}>
          <ExportIcon />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};