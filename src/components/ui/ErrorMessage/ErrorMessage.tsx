import React from 'react';
import styles from './ErrorMessage.module.css';

// Default SVG icon for a visually distinct error state.
// Encapsulated within the component file for portability.
const DefaultErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    width="24"
    height="24"
  >
    <path
      fillRule="evenodd"
      d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 16a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H12a1 1 0 01-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Props for the ErrorMessage component.
 */
export interface ErrorMessageProps {
  /**
   * The main title for the error message.
   */
  title: string;
  /**
   * The detailed error message. Can be a string or custom JSX.
   */
  message: React.ReactNode;
  /**
   * An optional callback function to be executed when the user clicks the "Try Again" button.
   * The button will only be rendered if this prop is provided.
   */
  onRetry?: () => void;
  /**
   * An optional custom icon to display. If not provided, a default error icon will be used.
   */
  icon?: React.ReactNode;
  /**
   * Optional additional CSS class names to apply to the root element for custom styling.
   */
  className?: string;
}

/**
 * A component designed to gracefully display API or application errors.
 * It is accessible, visually distinct, and provides an optional retry mechanism.
 *
 * @param {ErrorMessageProps} props The props for the component.
 * @returns {JSX.Element} The rendered ErrorMessage component.
 */
export const ErrorMessage = ({
  title,
  message,
  onRetry,
  icon = <DefaultErrorIcon />,
  className = '',
}: ErrorMessageProps): JSX.Element => {
  const containerClasses = `${styles.container} ${className}`.trim();

  return (
    <section
      className={containerClasses}
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-title"
      aria-describedby="error-message"
    >
      <div className={styles.iconContainer}>{icon}</div>
      <div className={styles.contentContainer}>
        <h2 id="error-title" className={styles.title}>
          {title}
        </h2>
        <p id="error-message" className={styles.message}>
          {message}
        </p>
        {onRetry && (
          <button onClick={onRetry} className={styles.retryButton}>
            Try Again
          </button>
        )}
      </div>
    </section>
  );
};