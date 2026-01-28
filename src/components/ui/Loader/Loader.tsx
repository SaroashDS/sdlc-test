import React from 'react';
import styles from './Loader.module.css';

/**
 * LoaderProps defines the props for the Loader component.
 * Currently, it accepts no props as per the specification.
 */
interface LoaderProps {}

/**
 * A visually elegant and accessible loading indicator component.
 * It is designed to signify an ongoing process, such as data fetching.
 *
 * @component
 * @example
 * return <Loader />
 *
 * @accessibility
 * - The component uses `role="status"` to inform screen readers about a dynamic
 *   content change, indicating an ongoing process.
 * - A visually hidden "Loading..." text is included to provide a textual
 *   alternative for the visual spinner.
 * - The animated spinner element has `aria-hidden="true"` to prevent redundant
 *   announcements by screen readers.
 */
const Loader: React.FC<LoaderProps> = () => {
  return (
    <div className={styles.loaderWrapper} role="status">
      <div className={styles.spinner} aria-hidden="true" />
      <span className={styles.visuallyHidden}>Loading...</span>
    </div>
  );
};

export default Loader;