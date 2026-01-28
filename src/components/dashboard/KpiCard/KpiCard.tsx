import React from 'react';
import styles from './KpiCard.module.css';

// --- Helper Components (Self-contained SVGs for zero dependencies) ---

/**
 * Renders a trend icon (up, down, or neutral) based on the change type.
 * @internal
 */
const TrendIcon = ({ type }: { type: 'positive' | 'negative' | 'neutral' }) => {
  const icons = {
    positive: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5l0 14" />
        <path d="M18 11l-6 -6l-6 6" />
      </svg>
    ),
    negative: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5l0 14" />
        <path d="M18 13l-6 6l-6 -6" />
      </svg>
    ),
    neutral: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l14 0" />
      </svg>
    ),
  };
  return icons[type] || null;
};

/**
 * Renders a standard information icon for the tooltip trigger.
 * @internal
 */
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

// --- Prop Interfaces ---

export interface KpiCardProps {
  /** The main title of the Key Performance Indicator. */
  title: string;
  /** The primary value to be displayed, formatted as a string (e.g., "$1.2M"). */
  value: string;
  /** The change value, also formatted as a string (e.g., "+12.2%"). */
  change: string;
  /** The nature of the change, which dictates the color and icon used. */
  changeType: 'positive' | 'negative' | 'neutral';
  /** An optional React node (e.g., an SVG icon) to display next to the title. */
  icon?: React.ReactNode;
  /** Optional descriptive text that appears in a tooltip to explain the KPI. */
  info?: string;
  /** Optional CSS class to apply to the root element for custom styling. */
  className?: string;
}

// --- Main Component ---

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  info,
  className,
}) => {
  // Construct a comprehensive ARIA label for screen reader users.
  const changeTypeDescription =
    changeType === 'positive' ? 'Increase' : changeType === 'negative' ? 'Decrease' : 'No change';
  const fullAriaLabel = `KPI for ${title}: Current value is ${value}. ${changeTypeDescription} of ${change.replace(
    /[+-]/g,
    ''
  )}.`;

  const cardClasses = [styles.card, className].filter(Boolean).join(' ');

  return (
    <article className={cardClasses} aria-label={fullAriaLabel}>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          {icon && <div className={styles.iconWrapper} aria-hidden="true">{icon}</div>}
          <h2 className={styles.title}>{title}</h2>
        </div>
        {info && (
          <div className={styles.infoTooltipWrapper} tabIndex={0} aria-label={`Information about ${title}`}>
            <InfoIcon />
            <span className={styles.infoTooltipText} role="tooltip">
              {info}
            </span>
          </div>
        )}
      </header>
      <main className={styles.mainContent}>
        <p className={styles.value}>{value}</p>
        <div
          className={`${styles.changeIndicator} ${styles[changeType]}`}
          aria-label={`${changeTypeDescription} of ${change.replace(/[+-]/g, '')}`}
        >
          <TrendIcon type={changeType} />
          <span className={styles.changeValue}>{change}</span>
        </div>
      </main>
    </article>
  );
};