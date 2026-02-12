/**
 * @file TypeScript types for analytics data
 */

/**
 * Represents the basic structure of an analytics event.
 */
export interface AnalyticsEvent {
  /**
   * The name of the event.  Should be descriptive and consistent.
   * @example "button_click", "page_view", "form_submission"
   */
  eventName: string;

  /**
   * Timestamp of when the event occurred, in milliseconds since the Unix epoch.
   */
  timestamp: number;

  /**
   * Optional user ID associated with the event.  Use only if user is authenticated.
   */
  userId?: string;

  /**
   * Optional session ID associated with the event.
   */
  sessionId?: string;

  /**
   * Optional properties associated with the event.  Should be serializable to JSON.
   */
  properties?: Record<string, any>;
}

/**
 * Represents the context in which an analytics event occurred.
 */
export interface AnalyticsContext {
  /**
   * The URL of the page where the event occurred.
   */
  pageUrl: string;

  /**
   * The referrer URL of the page where the event occurred.
   */
  referrerUrl?: string;

  /**
   * The user agent string of the user's browser.
   */
  userAgent: string;

  /**
   * The screen resolution of the user's device.
   * @example "1920x1080"
   */
  screenResolution?: string;
}

/**
 * Represents a complete analytics payload, including the event and context.
 */
export interface AnalyticsPayload {
  /**
   * The analytics event.
   */
  event: AnalyticsEvent;

  /**
   * The context in which the event occurred.
   */
  context: AnalyticsContext;
}

/**
 * Type representing a function that sends analytics data.
 */
export type AnalyticsSender = (payload: AnalyticsPayload) => Promise<void>;

/**
 * Type representing a function that enriches an analytics event with additional data.
 */
export type AnalyticsEnricher = (event: AnalyticsEvent) => AnalyticsEvent;

/**
 * Type representing a function that filters an analytics event based on certain criteria.
 */
export type AnalyticsFilter = (event: AnalyticsEvent) => boolean;

/**
 * Type representing a configuration object for analytics.
 */
export interface AnalyticsConfig {
  /**
   * The function to use to send analytics data.
   */
  sender: AnalyticsSender;

  /**
   * Optional array of enrichers to apply to each event.
   */
  enrichers?: AnalyticsEnricher[];

  /**
   * Optional array of filters to apply to each event.
   */
  filters?: AnalyticsFilter[];

  /**
   * Optional flag to disable analytics.
   */
  disabled?: boolean;
}

/**
 * Type representing the possible values for a user's consent status.
 */
export type ConsentStatus = 'granted' | 'denied' | 'unknown';

/**
 * Interface representing user consent information.
 */
export interface UserConsent {
  /**
   * The current consent status.
   */
  status: ConsentStatus;

  /**
   * Optional timestamp of when the consent status was last updated.
   */
  lastUpdated?: number;
}

/**
 * Type representing a partial AnalyticsEvent, useful for creating events.
 */
export type PartialAnalyticsEvent = Omit<AnalyticsEvent, 'timestamp' | 'eventName'> & { eventName: string; timestamp?: number };