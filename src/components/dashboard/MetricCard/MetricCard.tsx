import React, { useId } from 'react';
import styles from './MetricCard.module.css';

// --- TYPE DEFINITIONS ---

/**
 * Defines the trend direction for styling and accessibility.
 */
type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Interface for the trend object.
 */
interface Trend {
  /** The direction of the trend. */
  direction: TrendDirection;
  /** The value to display, e.g., "+5.2%" or "-$1,200". */
  value: string;
}

/**
 * Props for the MetricCard component.
 */
export interface MetricCardProps {
  /** The main title of the metric. */
  title: string;
  /** The primary value to be displayed. Should be pre-formatted. */
  value: string;
  /** An object describing the metric's trend. */
  trend: Trend;
  /** An optional icon to display next to the title. */
  icon?: React.ReactNode;
  /** Optional additional className for custom styling. */
  className?: string;
}

// --- HELPER COMPONENTS & UTILITIES ---

/**
 * A lightweight utility for conditionally joining class names.
 * @param classes - A list of strings, booleans, or nulls.
 * @returns A single string of space-separated class names.
 */
const cx = (...classes: (string | boolean | undefined | null)[]): string =>
  classes.filter(Boolean).join(' ');

/**
 * SVG icon for an upward trend.
 */
const TrendUpIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={styles.trendIcon}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * SVG icon for a downward trend.
 */
const TrendDownIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={styles.trendIcon}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 3a.75.75 0 01.75.75v10.638l4.22-4.22a.75.75 0 111.06 1.06l-5.25 5.25a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 111.06-1.06L9.25 14.388V3.75A.75.75 0 0110 3z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * SVG icon for a neutral trend.
 */
const TrendNeutralIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={styles.trendIcon}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
  </svg>
);

const trendIconMap: Record<TrendDirection, React.ReactNode> = {
  up: <TrendUpIcon />,
  down: <TrendDownIcon />,
  neutral: <TrendNeutralIcon />,
};

// --- MAIN COMPONENT ---

/**
 * MetricCard is a premium component designed to display a single key metric,
 * including its title, value, and a clear trend indicator. It features a
 * modern glassmorphism design and is fully accessible.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
  className,
}) => {
  // Generate a unique ID for ARIA attributes to ensure accessibility.
  const titleId = useId();

  const trendClasses = cx(
    styles.trend,
    trend.direction === 'up' && styles.trendUp,
    trend.direction === 'down' && styles.trendDown,
    trend.direction === 'neutral' && styles.trendNeutral
  );

  const trendAriaLabel = `Trend: ${trend.direction} by ${trend.value}`;

  return (
    <article
      className={cx(styles.card, className)}
      aria-labelledby={titleId}
      role="region"
    >
      <header className={styles.header}>
        {icon && <div className={styles.titleIconWrapper}>{icon}</div>}
        <h2 className={styles.title} id={titleId}>
          {title}
        </h2>
      </header>

      <p className={styles.value}>{value}</p>

      <div className={trendClasses} aria-label={trendAriaLabel}>
        {trendIconMap[trend.direction]}
        <span>{trend.value}</span>
      </div>
    </article>
  );
};