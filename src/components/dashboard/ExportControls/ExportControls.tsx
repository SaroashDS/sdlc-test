import React from 'react';
import styles from './ExportControls.module.css';

// --- TYPE DEFINITIONS ---

interface ExportButtonProps {
  onClick: () => void;
  isLoading: boolean;
  format: 'CSV' | 'PDF' | 'JSON';
  'aria-controls'?: string; // Optional: ID of the element this control affects
}

interface ExportControlsProps {
  /**
   * Handler function to trigger a CSV export.
   */
  onExportCSV: () => void;
  /**
   * Handler function to trigger a PDF export.
   */
  onExportPDF: () => void;
  /**
   * Handler function to trigger a JSON export.
   */
  onExportJSON: () => void;
  /**
   * Loading state for the CSV export.
   */
  isExportingCSV: boolean;
  /**
   * Loading state for the PDF export.
   */
  isExportingPDF: boolean;
  /**
   * Loading state for the JSON export.
   */
  isExportingJSON: boolean;
  /**
   * Optional external class name for custom styling.
   */
  className?: string;
}


// --- SVG ICON COMPONENTS ---

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    className={styles.spinner}
    viewBox="0 0 50 50"
    aria-hidden="true"
    {...props}
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      strokeWidth="5"
    ></circle>
  </svg>
);


// --- SUB-COMPONENTS ---

const ExportButton: React.FC<ExportButtonProps> = ({ onClick, isLoading, format, 'aria-controls': ariaControls }) => (
  <button
    type="button"
    className={styles.exportButton}
    onClick={onClick}
    disabled={isLoading}
    aria-busy={isLoading}
    aria-controls={ariaControls}
  >
    {isLoading ? <SpinnerIcon /> : <DownloadIcon className={styles.icon} />}
    <span className={styles.buttonText}>{format}</span>
    <span className="visually-hidden" aria-live="polite">
      {isLoading ? `Exporting ${format}...` : ''}
    </span>
  </button>
);


// --- MAIN COMPONENT ---

/**
 * A UI component providing users with controls to export data in various formats.
 * It features a modern glassmorphism design and handles loading states for each export type.
 */
export const ExportControls: React.FC<ExportControlsProps> = ({
  onExportCSV,
  onExportPDF,
  onExportJSON,
  isExportingCSV,
  isExportingPDF,
  isExportingJSON,
  className,
}) => {
  const containerClasses = [styles.exportControls, className].filter(Boolean).join(' ');

  return (
    <section className={containerClasses} aria-labelledby="export-controls-title">
      <h2 id="export-controls-title" className="visually-hidden">
        Data Export Controls
      </h2>
      <div className={styles.buttonGroup}>
        <ExportButton
          onClick={onExportCSV}
          isLoading={isExportingCSV}
          format="CSV"
        />
        <ExportButton
          onClick={onExportPDF}
          isLoading={isExportingPDF}
          format="PDF"
        />
        <ExportButton
          onClick={onExportJSON}
          isLoading={isExportingJSON}
          format="JSON"
        />
      </div>
    </section>
  );
};

// Note: For the `.visually-hidden` class, you would typically have a global CSS utility like:
/*
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
*/