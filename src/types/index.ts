/**
 * @file src/types/index.ts
 * @description Centralized TypeScript types for metrics, user data, and navigation items.
 */

// =================================================================
// Metrics Types
// =================================================================

/**
 * Represents the possible units for a metric value.
 */
export type MetricUnit = 'ms' | '%' | 's' | 'count' | 'bytes' | 'gb';

/**
 * Represents a single data point for a metric.
 * This can be used for performance monitoring, user engagement, or system health checks.
 */
export interface Metric {
  /** A unique identifier for the metric. */
  readonly id: string;
  /** The name of the metric (e.g., 'cpu-usage', 'page-load-time'). */
  name: string;
  /** The recorded value of the metric. */
  value: number;
  /** The unit of measurement for the metric's value. */
  unit: MetricUnit;
  /** The ISO 8601 timestamp of when the metric was recorded. */
  timestamp: string;
  /** Optional key-value pairs for additional context (e.g., { region: 'us-east-1' }). */
  tags?: Record<string, string | number>;
}

/**
 * A collection of related metrics, often used for charting or reporting.
 */
export interface MetricDataSet {
  /** A descriptive label for the data set (e.g., 'API Response Times - Last 24h'). */
  label: string;
  /** An array of individual metric data points. */
  data: Metric[];
}


// =================================================================
// User Data Types
// =================================================================

/**
 * Defines the possible roles a user can have within the system.
 * - 'admin': Full access to all system features.
 * - 'editor': Can create and manage content.
 * - 'viewer': Read-only access to content.
 */
export type UserRole = 'admin' | 'editor' | 'viewer';

/**
 * Represents user-specific application settings.
 */
export interface UserPreferences {
  /** The preferred color theme for the UI. */
  theme: 'light' | 'dark' | 'system';
  /** Indicates if the user has enabled email notifications. */
  notifications: {
    email: boolean;
    push: boolean;
  };
  /** The user's preferred language, represented as a language code (e.g., 'en-US'). */
  language: string;
}

/**
 * Represents a user account in the system.
 */
export interface User {
  /** The unique identifier for the user, typically a UUID. */
  readonly id: string;
  /** The user's unique username. */
  username: string;
  /** The user's email address. */
  email: string;
  /** The user's full name. */
  fullName: string;
  /** A URL pointing to the user's avatar image. */
  avatarUrl?: string;
  /** The role assigned to the user, which determines their permissions. */
  role: UserRole;
  /** The date the user account was created. */
  createdAt: Date;
  /** The last time the user's profile was updated. */
  updatedAt: Date;
  /** A collection of user-specific preferences. */
  preferences: UserPreferences;
}

/**
 * Represents the currently authenticated user's session.
 */
export interface UserSession {
  /** The authenticated user's data, or null if no user is logged in. */
  user: User | null;
  /** The session's expiration timestamp. */
  expires: string;
  /** A token used for authenticating API requests. */
  accessToken: string;
}


// =================================================================
// Navigation Types
// =================================================================

/**
 * Represents a single item in a navigation menu, such as a sidebar or header menu.
 * It can contain nested children to create multi-level menus.
 */
export interface NavigationItem {
  /** A unique identifier for the navigation item. */
  readonly id: string;
  /** The text label to be displayed for the link. */
  label: string;
  /** The URL path the item links to. */
  path: string;
  /** An identifier for the icon to be displayed next to the label (e.g., 'home', 'settings'). */
  icon?: string;
  /** An optional array of child navigation items for creating sub-menus. */
  children?: NavigationItem[];
  /** If true, the navigation item will be displayed in a disabled state. */
  disabled?: boolean;
}

/**
 * A type alias for an array of NavigationItem, representing a complete menu structure.
 */
export type NavigationMenu = NavigationItem[];


// =================================================================
// General Utility Types
// =================================================================

/**
 * A generic type for a standardized API response structure.
 * @template T The type of the data payload in a successful response.
 */
export interface ApiResponse<T> {
  /** Indicates whether the request was successful. */
  success: boolean;
  /** The data payload for a successful response. */
  data?: T;
  /** An error object for a failed response. */
  error?: {
    message: string;
    code?: number | string;
  };
}