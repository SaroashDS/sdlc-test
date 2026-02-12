/**
 * @file src/types/index.test.ts
 * @description Jest tests for the centralized TypeScript types.
 *
 * These tests don't validate runtime logic, as the file only contains type definitions.
 * Instead, they serve as a compile-time check to ensure that objects can be created
 * that conform to these types, and they act as living documentation for the expected
 * data structures.
 */

import type {
  Metric,
  MetricDataSet,
  MetricUnit,
  User,
  UserPreferences,
  UserRole,
  UserSession,
  NavigationItem,
  NavigationMenu,
  ApiResponse,
} from './index';

// =================================================================
// Metrics Types Tests
// =================================================================

describe('Metrics Types', () => {
  describe('Metric', () => {
    it('should allow creation of a valid Metric object with all properties', () => {
      const now = new Date().toISOString();
      const metric: Metric = {
        id: 'metric-123',
        name: 'page-load-time',
        value: 150.75,
        unit: 'ms',
        timestamp: now,
        tags: {
          region: 'us-east-1',
          browser: 'chrome',
        },
      };

      expect(metric.id).toBe('metric-123');
      expect(metric.name).toBe('page-load-time');
      expect(metric.value).toBe(150.75);
      expect(metric.unit).toBe('ms');
      expect(metric.timestamp).toBe(now);
      expect(metric.tags).toEqual({
        region: 'us-east-1',
        browser: 'chrome'
      });
    });

    it('should allow creation of a valid Metric object without optional tags', () => {
      const now = new Date().toISOString();
      const metric: Metric = {
        id: 'metric-456',
        name: 'cpu-usage',
        value: 99,
        unit: '%',
        timestamp: now,
      };

      expect(metric.id).toBe('metric-456');
      expect(metric.tags).toBeUndefined();
    });

    it('should correctly type all possible MetricUnit values', () => {
      const units: MetricUnit[] = ['ms', '%', 's', 'count', 'bytes', 'gb'];
      units.forEach(unit => {
        const metric: Metric = {
          id: `metric-${unit}`,
          name: 'test-metric',
          value: 1,
          unit: unit,
          timestamp: new Date().toISOString(),
        };
        expect(metric.unit).toBe(unit);
      });
    });
  });

  describe('MetricDataSet', () => {
    it('should allow creation of a valid MetricDataSet object', () => {
      const now = new Date().toISOString();
      const metricDataSet: MetricDataSet = {
        label: 'API Response Times - Last 24h',
        data: [{
          id: 'api-resp-1',
          name: 'api-response-time',
          value: 210,
          unit: 'ms',
          timestamp: now,
        }, {
          id: 'api-resp-2',
          name: 'api-response-time',
          value: 198,
          unit: 'ms',
          timestamp: now,
        }, ],
      };

      expect(metricDataSet.label).toBe('API Response Times - Last 24h');
      expect(metricDataSet.data).toHaveLength(2);
      expect(metricDataSet.data[0].id).toBe('api-resp-1');
    });

    it('should allow an empty data array in a MetricDataSet', () => {
      const metricDataSet: MetricDataSet = {
        label: 'No Data Available',
        data: [],
      };
      expect(metricDataSet.label).toBe('No Data Available');
      expect(metricDataSet.data).toHaveLength(0);
    });
  });
});

// =================================================================
// User Data Types Tests
// =================================================================

describe('User Data Types', () => {
  const createdAt = new Date('2023-01-01T12:00:00.000Z');
  const updatedAt = new Date('2023-10-26T18:30:00.000Z');

  const userPreferences: UserPreferences = {
    theme: 'dark',
    notifications: {
      email: true,
      push: false,
    },
    language: 'en-US',
  };

  describe('User', () => {
    it('should allow creation of a valid User object with all properties', () => {
      const user: User = {
        id: 'user-uuid-123',
        username: 'johndoe',
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'admin',
        createdAt,
        updatedAt,
        preferences: userPreferences,
      };

      expect(user.id).toBe('user-uuid-123');
      expect(user.role).toBe('admin');
      expect(user.avatarUrl).toBe('https://example.com/avatar.png');
      expect(user.preferences.theme).toBe('dark');
    });

    it('should allow creation of a valid User object without optional avatarUrl', () => {
      const user: User = {
        id: 'user-uuid-456',
        username: 'jane.doe',
        email: 'jane.doe@example.com',
        fullName: 'Jane Doe',
        role: 'editor',
        createdAt,
        updatedAt,
        preferences: userPreferences,
      };

      expect(user.id).toBe('user-uuid-456');
      expect(user.avatarUrl).toBeUndefined();
    });

    it('should correctly type all possible UserRole values', () => {
      const roles: UserRole[] = ['admin', 'editor', 'viewer'];
      roles.forEach(role => {
        const user: User = {
          id: `user-${role}`,
          username: `user-${role}`,
          email: `${role}@example.com`,
          fullName: `User ${role}`,
          role: role,
          createdAt,
          updatedAt,
          preferences: userPreferences,
        };
        expect(user.role).toBe(role);
      });
    });
  });

  describe('UserSession', () => {
    it('should allow creation of a valid UserSession with a logged-in user', () => {
      const user: User = {
        id: 'user-uuid-789',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'viewer',
        createdAt,
        updatedAt,
        preferences: userPreferences,
      };

      const session: UserSession = {
        user: user,
        expires: new Date(Date.now() + 3600 * 1000).toISOString(),
        accessToken: 'jwt-token-string',
      };

      expect(session.user).toBeDefined();
      expect(session.user?.id).toBe('user-uuid-789');
      expect(session.accessToken).toBe('jwt-token-string');
    });

    it('should allow creation of a valid UserSession with a null user (logged out)', () => {
      const session: UserSession = {
        user: null,
        expires: new Date().toISOString(),
        accessToken: '',
      };

      expect(session.user).toBeNull();
      expect(session.accessToken).toBe('');
    });
  });
});

// =================================================================
// Navigation Types Tests
// =================================================================

describe('Navigation Types', () => {
  describe('NavigationItem', () => {
    it('should allow creation of a simple NavigationItem', () => {
      const navItem: NavigationItem = {
        id: 'nav-home',
        label: 'Home',
        path: '/',
        icon: 'home-icon',
      };

      expect(navItem.id).toBe('nav-home');
      expect(navItem.children).toBeUndefined();
      expect(navItem.disabled).toBeUndefined();
    });

    it('should allow creation of a disabled NavigationItem', () => {
      const navItem: NavigationItem = {
        id: 'nav-billing',
        label: 'Billing',
        path: '/billing',
        disabled: true,
      };

      expect(navItem.disabled).toBe(true);
    });

    it('should allow creation of a NavigationItem with children (sub-menu)', () => {
      const parentItem: NavigationItem = {
        id: 'nav-settings',
        label: 'Settings',
        path: '/settings',
        icon: 'settings-icon',
        children: [{
          id: 'nav-profile',
          label: 'Profile',
          path: '/settings/profile',
        }, {
          id: 'nav-account',
          label: 'Account',
          path: '/settings/account',
        }, ],
      };

      expect(parentItem.children).toBeDefined();
      expect(parentItem.children).toHaveLength(2);
      expect(parentItem.children?.[0].id).toBe('nav-profile');
    });
  });

  describe('NavigationMenu', () => {
    it('should allow creation of a valid NavigationMenu', () => {
      const menu: NavigationMenu = [{
        id: 'nav-dashboard',
        label: 'Dashboard',
        path: '/dashboard',
      }, {
        id: 'nav-reports',
        label: 'Reports',
        path: '/reports',
        children: [{
          id: 'nav-sales',
          label: 'Sales',
          path: '/reports/sales',
        }, ],
      }, ];

      expect(menu).toHaveLength(2);
      expect(menu[1].children).toHaveLength(1);
    });

    it('should allow an empty NavigationMenu', () => {
      const menu: NavigationMenu = [];
      expect(menu).toHaveLength(0);
    });
  });
});

// =================================================================
// General Utility Types Tests
// =================================================================

describe('ApiResponse Type', () => {
  it('should allow creation of a successful ApiResponse with data', () => {
    const userPayload: User = {
      id: 'user-uuid-123',
      username: 'johndoe',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'light',
        notifications: {
          email: false,
          push: true
        },
        language: 'fr-FR',
      },
    };

    const response: ApiResponse < User > = {
      success: true,
      data: userPayload,
    };

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data?.id).toBe('user-uuid-123');
    expect(response.error).toBeUndefined();
  });

  it('should allow creation of a failed ApiResponse with an error object', () => {
    const response: ApiResponse < null > = {
      success: false,
      error: {
        message: 'User not found',
        code: 404,
      },
    };

    expect(response.success).toBe(false);
    expect(response.data).toBeUndefined();
    expect(response.error).toBeDefined();
    expect(response.error?.message).toBe('User not found');
    expect(response.error?.code).toBe(404);
  });

  it('should allow creation of a failed ApiResponse with a string error code', () => {
    const response: ApiResponse < any > = {
      success: false,
      error: {
        message: 'Invalid input parameters',
        code: 'VALIDATION_ERROR',
      },
    };

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('VALIDATION_ERROR');
  });
});