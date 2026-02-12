import React, { type ReactNode, type HTMLAttributes } from 'react';
import styles from './Card.module.css';

/**
 * Props for the Card component.
 * Extends standard HTML section attributes for maximum flexibility.
 */
export interface CardProps extends HTMLAttributes<HTMLElement> {
  /**
   * The primary content to be displayed within the card.
   */
  children: ReactNode;
  /**
   * An optional title for the card, displayed in the header.
   * Renders an `<h2>` tag for semantic correctness.
   */
  title?: string;
  /**
   * Optional slot for action elements like buttons or menus,
   * displayed in the header opposite the title.
   */
  actions?: ReactNode;
  /**
   * Custom CSS class name(s) to apply to the card's root element.
   */
  className?: string;
}

/**
 * A versatile Card component to act as a container for metrics and charts.
 * It features a premium, glassmorphic design with soft shadows and rounded corners,
 * suitable for modern data-driven UIs.
 *
 * @param {CardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Card component.
 */
export const Card: React.FC<CardProps> = ({
  children,
  title,
  actions,
  className = '',
  ...rest
}) => {
  const hasHeader = title || actions;
  const cardId = React.useId();
  const titleId = title ? `card-title-${cardId}` : undefined;

  return (
    <section
      className={`${styles.card} ${className}`}
      aria-labelledby={titleId}
      {...rest}
    >
      {hasHeader && (
        <header className={styles.header}>
          {title && (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          )}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </section>
  );
};