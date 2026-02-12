// DashboardPage.test.tsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { HelmetProvider } from 'react-helmet-async';

// Mock the API call
const mockDashboardData = {
  totalUsers: 100,
  activeUsers: 50,
};

const mockFetch = (data: any, ok: boolean = true) => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: ok,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock;
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <HelmetProvider>
        <Router>
          <DashboardPage />
        </Router>
      </HelmetProvider>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays dashboard data', async () => {
    mockFetch(mockDashboardData);

    render(
      <HelmetProvider>
        <Router>
          <DashboardPage />
        </Router>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  it('displays error message when fetch fails', async () => {
    mockFetch({}, false);

    render(
      <HelmetProvider>
        <Router>
          <DashboardPage />
        </Router>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('displays a custom error message when fetch throws an error', async () => {
    global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error('Custom error message')));

    render(
      <HelmetProvider>
        <Router>
          <DashboardPage />
        </Router>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error: Custom error message/)).toBeInTheDocument();
    });
  });

  it('renders the "Go to Settings" link', async () => {
    mockFetch(mockDashboardData);

    render(
      <HelmetProvider>
        <Router>
          <DashboardPage />
        </Router>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Go to Settings')).toBeInTheDocument();
    });
  });

  it('updates the document title and meta description', async () => {
    mockFetch(mockDashboardData);

    render(
      <HelmetProvider>
        <Router>
          <DashboardPage />
        </Router>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toBe('Dashboard - Your App');
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription?.getAttribute('content')).toBe('Main dashboard page for Your App.');
    });
  });

  it('handles no dashboard data gracefully', async () => {
    mockFetch(null);

    render(
      <HelmetProvider>
        <Router>
          <DashboardPage />
        </Router>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});

// SettingsPage.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsPage from './SettingsPage';
import { HelmetProvider } from 'react-helmet-async';

describe('SettingsPage', () => {
  it('renders the settings page content', () => {
    render(
      <HelmetProvider>
        <SettingsPage />
      </HelmetProvider>
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Settings content goes here.')).toBeInTheDocument();
  });

  it('updates the document title and meta description', () => {
    render(
      <HelmetProvider>
        <SettingsPage />
      </HelmetProvider>
    );

    expect(document.title).toBe('Settings - Your App');
    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Settings page for Your App.');
  });
});

// App.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { HelmetProvider } from 'react-helmet-async';

jest.mock('./DashboardPage', () => {
  return {
    __esModule: true,
    default: () => <div>Mock Dashboard Page</div>,
  };
});

jest.mock('./SettingsPage', () => {
  return {
    __esModule: true,
    default: () => <div>Mock Settings Page</div>,
  };
});

describe('App Component', () => {
  it('renders the App component with navigation links', () => {
    render(
      <HelmetProvider>
        <Router>
          <App />
        </Router>
      </HelmetProvider>
    );

    expect(screen.getByText('Your App')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the DashboardPage component when navigating to the root path', () => {
    window.history.pushState({}, 'Dashboard', '/');
    render(
      <HelmetProvider>
        <Router>
          <App />
        </Router>
      </HelmetProvider>
    );

    expect(screen.getByText('Mock Dashboard Page')).toBeInTheDocument();
  });

  it('renders the SettingsPage component when navigating to the settings path', () => {
    window.history.pushState({}, 'Settings', '/settings');
    render(
      <HelmetProvider>
        <Router>
          <App />
        </Router>
      </HelmetProvider>
    );

    expect(screen.getByText('Mock Settings Page')).toBeInTheDocument();
  });
});