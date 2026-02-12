/**
 * @jest-environment jsdom
 */

import {
  AnalyticsEventPayload,
  UserIdentification,
  PageViewEvent,
  CustomEvent,
  AnalyticsEvent,
  AnalyticsProviderConfig,
  AnalyticsProvider,
  AnalyticsProviderFactory,
  AnalyticsContextType,
} from './analytics';

describe('Analytics Type Definitions', () => {
  describe('AnalyticsEventPayload', () => {
    it('should create a valid AnalyticsEventPayload object', () => {
      const payload: AnalyticsEventPayload = {
        eventName: 'test_event',
        properties: { key1: 'value1', key2: 123 },
        timestamp: Date.now(),
      };

      expect(payload).toBeDefined();
      expect(payload.eventName).toBe('test_event');
      expect(payload.properties).toEqual({ key1: 'value1', key2: 123 });
      expect(payload.timestamp).toBeDefined();
    });

    it('should create a valid AnalyticsEventPayload object without optional properties', () => {
      const payload: AnalyticsEventPayload = {
        eventName: 'test_event',
      };

      expect(payload).toBeDefined();
      expect(payload.eventName).toBe('test_event');
      expect(payload.properties).toBeUndefined();
      expect(payload.timestamp).toBeUndefined();
    });
  });

  describe('UserIdentification', () => {
    it('should create a valid UserIdentification object', () => {
      const identification: UserIdentification = {
        userId: 'user123',
        traits: { name: 'John Doe', email: 'john.doe@example.com' },
      };

      expect(identification).toBeDefined();
      expect(identification.userId).toBe('user123');
      expect(identification.traits).toEqual({ name: 'John Doe', email: 'john.doe@example.com' });
    });

    it('should create a valid UserIdentification object without optional traits', () => {
      const identification: UserIdentification = {
        userId: 'user123',
      };

      expect(identification).toBeDefined();
      expect(identification.userId).toBe('user123');
      expect(identification.traits).toBeUndefined();
    });
  });

  describe('PageViewEvent', () => {
    it('should create a valid PageViewEvent object', () => {
      const pageView: PageViewEvent = {
        eventName: 'page_view',
        properties: {
          url: 'https://example.com/page',
          title: 'Example Page',
          referrer: 'https://google.com',
          customProp: 'customValue',
        },
      };

      expect(pageView).toBeDefined();
      expect(pageView.eventName).toBe('page_view');
      expect(pageView.properties.url).toBe('https://example.com/page');
      expect(pageView.properties.title).toBe('Example Page');
      expect(pageView.properties.referrer).toBe('https://google.com');
      expect(pageView.properties.customProp).toBe('customValue');
    });

    it('should create a valid PageViewEvent object without optional referrer', () => {
      const pageView: PageViewEvent = {
        eventName: 'page_view',
        properties: {
          url: 'https://example.com/page',
          title: 'Example Page',
        },
      };

      expect(pageView).toBeDefined();
      expect(pageView.eventName).toBe('page_view');
      expect(pageView.properties.url).toBe('https://example.com/page');
      expect(pageView.properties.title).toBe('Example Page');
      expect(pageView.properties.referrer).toBeUndefined();
    });
  });

  describe('CustomEvent', () => {
    it('should create a valid CustomEvent object', () => {
      const customEvent: CustomEvent = {
        eventName: 'custom_event',
        properties: { key1: 'value1', key2: 123 },
      };

      expect(customEvent).toBeDefined();
      expect(customEvent.eventName).toBe('custom_event');
      expect(customEvent.properties).toEqual({ key1: 'value1', key2: 123 });
    });

    it('should create a valid CustomEvent object without properties', () => {
      const customEvent: CustomEvent = {
        eventName: 'custom_event',
      };

      expect(customEvent).toBeDefined();
      expect(customEvent.eventName).toBe('custom_event');
      expect(customEvent.properties).toBeUndefined();
    });
  });

  describe('AnalyticsEvent', () => {
    it('should accept a PageViewEvent', () => {
      const pageView: PageViewEvent = {
        eventName: 'page_view',
        properties: { url: 'https://example.com', title: 'Example' },
      };
      const event: AnalyticsEvent = pageView;
      expect(event).toBeDefined();
    });

    it('should accept a CustomEvent', () => {
      const customEvent: CustomEvent = {
        eventName: 'custom_event',
        properties: { key: 'value' },
      };
      const event: AnalyticsEvent = customEvent;
      expect(event).toBeDefined();
    });
  });

  describe('AnalyticsProviderConfig', () => {
    it('should create a valid AnalyticsProviderConfig object', () => {
      const config: AnalyticsProviderConfig = {
        enabled: true,
        apiKey: 'test_api_key',
        apiUrl: 'https://example.com/api',
        options: { debug: true },
      };

      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.apiKey).toBe('test_api_key');
      expect(config.apiUrl).toBe('https://example.com/api');
      expect(config.options).toEqual({ debug: true });
    });

    it('should create a valid AnalyticsProviderConfig object with only enabled', () => {
      const config: AnalyticsProviderConfig = {
        enabled: true,
      };

      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.apiKey).toBeUndefined();
      expect(config.apiUrl).toBeUndefined();
      expect(config.options).toBeUndefined();
    });
  });

  describe('AnalyticsProvider Interface', () => {
    it('should define the required methods', () => {
      const provider: AnalyticsProvider = {
        initialize: jest.fn(),
        track: jest.fn(),
        identify: jest.fn(),
        setUserProperties: jest.fn(),
        reset: jest.fn(),
      };

      expect(provider.initialize).toBeDefined();
      expect(provider.track).toBeDefined();
      expect(provider.identify).toBeDefined();
      expect(provider.setUserProperties).toBeDefined();
      expect(provider.reset).toBeDefined();
    });
  });

  describe('AnalyticsProviderFactory', () => {
    it('should define a function that returns an AnalyticsProvider', () => {
      const factory: AnalyticsProviderFactory = () => ({
        initialize: jest.fn(),
        track: jest.fn(),
        identify: jest.fn(),
        setUserProperties: jest.fn(),
        reset: jest.fn(),
      });

      const provider = factory();
      expect(provider).toBeDefined();
      expect(provider.initialize).toBeDefined();
    });
  });

  describe('AnalyticsContextType', () => {
    it('should define the required methods and properties', () => {
      const context: AnalyticsContextType = {
        track: jest.fn(),
        identify: jest.fn(),
        setUserProperties: jest.fn(),
        reset: jest.fn(),
        enabled: true,
      };

      expect(context.track).toBeDefined();
      expect(context.identify).toBeDefined();
      expect(context.setUserProperties).toBeDefined();
      expect(context.reset).toBeDefined();
      expect(context.enabled).toBe(true);
    });
  });
});