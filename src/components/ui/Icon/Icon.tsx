import React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import styles from './Icon.module.css';

// Define standardized sizes for the icons, ensuring visual consistency.
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Define a standardized semantic color palette for the icons.
export type IconColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'success'
  | 'warning'
  | 'danger';

// Define the component's props interface.
// We extend the base LucideProps but omit 'size' and 'color' to enforce
// our standardized, class-based versions. This prevents one-off inline styles.
export interface IconProps extends Omit<LucideProps, 'size' | 'color'> {
  /**
   * The icon component from the lucide-react library.
   * @example
   * import { Mail } from 'lucide-react';
   * // <Icon icon={Mail} />
   */
  icon: LucideIcon;
  /**
   * The size of the icon, mapping to predefined CSS classes.
   * @default 'md'
   */
  size?: IconSize;
  /**
   * The semantic color of the icon, mapping to predefined CSS classes.
   * @default 'default'
   */
  color?: IconColor;
  /**
   * Optional class name to apply to the SVG element for further customization.
   */
  className?: string;
}

/**
 * A production-quality wrapper for the lucide-react icon library.
 * It standardizes the 'size' and 'color' props to ensure visual consistency
 * across the application by mapping them to a predefined set of CSS classes.
 *
 * All other props (e.g., `strokeWidth`, `onClick`, `aria-label`) are passed
 * directly to the underlying lucide-react SVG component for full flexibility.
 */
export const Icon: React.FC<IconProps> = ({
  icon: IconComponent,
  size = 'md',
  color = 'default',
  className,
  ...rest
}) => {
  // Construct the CSS class string.
  // This combines the base style, the size variant, the color variant,
  // and any additional class names passed via props.
  const iconClasses = [
    styles.icon,
    styles[size],
    styles[color],
    className,
  ]
    .filter(Boolean) // Remove any undefined or empty strings to prevent extra spaces.
    .join(' ');

  // Smart accessibility default: icons are decorative (`aria-hidden`) unless
  // an accessible name is provided via `aria-label` or `aria-labelledby`.
  const isDecorative = !rest['aria-label'] && !rest['aria-labelledby'];

  return (
    <IconComponent
      className={iconClasses}
      aria-hidden={isDecorative}
      {...rest}
    />
  );
};