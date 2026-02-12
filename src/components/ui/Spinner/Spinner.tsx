import React from 'react';
import styles from './Spinner.module.css';

/**
 * Defines the props for the Spinner component.
 */
interface SpinnerProps {
  /**
   * The size of the spinner.
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * The accessible label for the spinner, announced to screen readers.
   * @default 'Loading...'
   */
  label?: string;

  /**
   * Allows for custom class names to be passed to the component's root element
   * for additional styling overrides.
   */
  className?: string;
}

/**
 * A loading spinner component to indicate that a process is running.
 * It is accessible and customizable via props.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  label = 'Loading...',
  className = '',
}) => {
  // Combine CSS module classes with any custom classes passed via props.
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={spinnerClasses}
      role="status"
      aria-live="polite"
    >
      {/* The label is visually hidden but accessible to screen readers. */}
      <span className={styles.visuallyHidden}>{label}</span>
    </div>
  );
};

export default Spinner;