import React from 'react';

/**
 * Base properties for any navigation item.
 * All navigation items inherit these common properties.
 */
interface NavigationItemBase {
  /**
   * A unique identifier for the navigation item.
   * Essential for list rendering (e.g., React keys) and tracking.
   */
  id: string;
  /**
   * An optional icon to display alongside the label.
   * Can be a string (e.g., for an icon font class name) or a React component type.
   */
  icon?: string | React.ElementType;
  /**
   * An optional description or subtitle for the navigation item,
   * providing additional context.
   */
  description?: string;
  /**
   * Indicates if the navigation item is currently active.
   * Useful for styling the current page/section.
   */
  active?: boolean;
  /**
   * Indicates if the navigation item is disabled and should not be interactive.
   */
  disabled?: boolean;
  /**
   * Optional CSS class names to apply to the navigation item's root container.
   */
  className?: string;
  /**
   * Optional data-testid attribute for testing purposes,
   * allowing easy selection in automated tests.
   */
  testId?: string;
}

/**
 * Represents a clickable link in the navigation.
 * This is the most common type of navigation item.
 */
export interface NavigationLinkItem extends NavigationItemBase {
  /**
   * The type of navigation item. Defaults to 'link' if not specified.
   */
  type?: 'link';
  /**
   * The display label for the navigation item.
   * Can be a string or a React node for more complex labels (e.g., with embedded icons or formatting).
   */
  label: string | React.ReactNode;
  /**
   * The URL the link points to. This is mandatory for a link item.
   */
  href: string;
  /**
   * Specifies where to open the linked document.
   * Standard HTML `target` attribute values.
   */
  target?: '_self' | '_blank' | '_parent' | '_top';
  /**
   * Specifies the relationship of the target object to the link object.
   * Recommended for security with `target="_blank"` (e.g., "noopener noreferrer").
   */
  rel?: string;
  /**
   * An optional click handler function for the link.
   * It receives the React mouse event as an argument.
   */
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /**
   * Child navigation items, typically used for dropdowns, sub-menus, or nested navigation.
   * If present, this item might act as a trigger for its children.
   */
  children?: NavigationItem[];
}

/**
 * Represents a group header for a set of navigation items.
 * This item itself is typically not clickable and serves to categorize child links.
 */
export interface NavigationGroupItem extends NavigationItemBase {
  /**
   * The type of navigation item, explicitly set to 'group'.
   */
  type: 'group';
  /**
   * The label for the group header.
   * Can be a string or a React node. This is mandatory for a group.
   */
  label: string | React.ReactNode;
  /**
   * Child navigation items belonging to this group.
   * This is mandatory for a group item.
   */
  children: NavigationItem[];
  /**
   * Indicates if the group can be collapsed/expanded by the user.
   */
  collapsible?: boolean;
  /**
   * The initial collapsed state of the group if `collapsible` is true.
   * `true` means the group is initially collapsed.
   */
  collapsed?: boolean;
}

/**
 * Represents a visual separator in the navigation.
 * It typically renders a horizontal line or a space to divide navigation sections.
 */
export interface NavigationSeparatorItem extends Omit<NavigationItemBase, 'icon' | 'description' | 'active' | 'disabled' | 'label'> {
  /**
   * The type of navigation item, explicitly set to 'separator'.
   */
  type: 'separator';
}

/**
 * Represents a custom React component to be rendered as a navigation item.
 * This allows for highly flexible and dynamic navigation elements that don't fit
 * the standard link, group, or separator patterns.
 */
export interface NavigationCustomItem extends Omit<NavigationItemBase, 'icon' | 'description' | 'active' | 'disabled' | 'label'> {
  /**
   * The type of navigation item, explicitly set to 'custom'.
   */
  type: 'custom';
  /**
   * The React component type to render.
   * This component will be rendered in place of a standard navigation element.
   */
  component: React.ElementType;
  /**
   * Optional props to pass directly to the custom component.
   */
  props?: Record<string, any>;
}

/**
 * A union type representing any possible navigation item.
 * This allows for polymorphic arrays of navigation elements.
 */
export type NavigationItem =
  | NavigationLinkItem
  | NavigationGroupItem
  | NavigationSeparatorItem
  | NavigationCustomItem;

/**
 * Represents the overall configuration for a navigation menu.
 * It is an array of top-level navigation items, which can include nested structures.
 */
export type NavigationConfig = NavigationItem[];