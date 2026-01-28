import React, { useId, type FC, type ReactNode } from 'react';
import styles from './ChartContainer.module.css';

/**
 * Defines the props for the ChartContainer component.
 */
export interface ChartContainerProps {
  /**
   * The main title displayed at the top of the container.
   * This is also used for the `aria-labelledby` attribute for accessibility.
   */
  title: string;
  /**
   * A slot for placing action elements like buttons, filters, or date pickers
   * in the header of the container.
   */
  actions?: ReactNode;
  /**
   * The primary content of the container, typically a chart component.
   */
  children: ReactNode;
  /**
   * An optional CSS class name to apply to the root element for custom styling.
   */
  className?: string;
  /**
   * If true, the component will display a loading spinner instead of its children.
   * Defaults to `false`.
   */
  isLoading?: boolean;
  /**
   * If a string is provided, the component will display an error message
   * instead of its children.
   * Defaults to `null`.
   */
  error?: string | null;
}

/**
 * A visually polished and accessible wrapper for charts. It provides a consistent
 * structure with a title, an optional actions slot, and built-in handling for
 * loading and error states.
 */
export const ChartContainer: FC<ChartContainerProps> = ({
  title,
  actions,
  children,
  className,
  isLoading = false,
  error = null,
}) => {
  const titleId = useId();
  const containerClasses = [styles.container, className].filter(Boolean).join(' ');

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.stateOverlay} role="status" aria-live="polite">
          <div className={styles.spinner} />
          <span className="sr-only">Loading chart data...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.stateOverlay} role="alert">
          <div className={styles.errorIconWrapper}>
            <svg
              className={styles.errorIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      );
    }
    return children;
  };

  return (
    <section
      className={containerClasses}
      role="region"
      aria-labelledby={titleId}
      aria-busy={isLoading}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <div className={styles.content}>{renderContent()}</div>
    </section>
  );
};

// A visually hidden class for screen-reader-only text.
// Can be placed in a global CSS file.
/*
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
*/