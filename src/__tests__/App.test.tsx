import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import App from './App';

// --- Mocks for Lazy-loaded Components ---
// We mock the page components to avoid the overhead of lazy loading and to
// isolate the App component's routing logic for testing.
jest.mock('./pages/HomePage', () => () => (
  <div>
    <h1>Home Page Content</h1>
  </div>
));

jest.mock('./pages/DashboardPage', () => () => (
  <div>
    <h1>Dashboard Page Content</h1>
  </div>
));

jest.mock('./pages/SettingsPage', () => () => (
  <div>
    <h1>Settings Page Content</h1>
  </div>
));

// --- Test Suite ---
describe('App', () => {
  // Helper function to set the initial route for tests
  const renderWithInitialRoute = (route: string) => {
    window.history.pushState({}, 'Test page', route);
    return render(<App />);
  };

  test('renders the main layout and navigation correctly', async () => {
    render(<App />);

    // Check for sidebar elements
    expect(screen.getByLabelText('Main Navigation')).toBeInTheDocument();
    expect(screen.getByText('ArchitectUI')).toBeInTheDocument();

    // Check for all navigation links
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();

    // Check for the main content area
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('renders the HomePage by default and sets the active link', async () => {
    render(<App />);

    // The HomePage content should be visible
    expect(await screen.findByRole('heading', { name: /home page content/i })).toBeInTheDocument();

    // The "Home" link should have the active class
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveClass('activeLink');

    // Other links should not be active
    expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveClass('activeLink');
    expect(screen.getByRole('link', { name: /settings/i })).not.toHaveClass('activeLink');
  });

  test('navigates to the Dashboard page when the link is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially, we are on the Home page
    expect(await screen.findByRole('heading', { name: /home page content/i })).toBeInTheDocument();

    // Click the Dashboard link
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    await user.click(dashboardLink);

    // The DashboardPage content should now be visible
    expect(await screen.findByRole('heading', { name: /dashboard page content/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /home page content/i })).not.toBeInTheDocument();

    // The "Dashboard" link should now be active
    expect(dashboardLink).toHaveClass('activeLink');
    expect(screen.getByRole('link', { name: /home/i })).not.toHaveClass('activeLink');
  });

  test('navigates to the Settings page when the link is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click the Settings link
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    await user.click(settingsLink);

    // The SettingsPage content should now be visible
    expect(await screen.findByRole('heading', { name: /settings page content/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /home page content/i })).not.toBeInTheDocument();

    // The "Settings" link should now be active
    expect(settingsLink).toHaveClass('activeLink');
    expect(screen.getByRole('link', { name: /home/i })).not.toHaveClass('activeLink');
  });

  test('navigates back to Home page after visiting another page', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Go to Dashboard
    await user.click(screen.getByRole('link', { name: /dashboard/i }));
    expect(await screen.findByRole('heading', { name: /dashboard page content/i })).toBeInTheDocument();

    // Go back to Home
    const homeLink = screen.getByRole('link', { name: /home/i });
    await user.click(homeLink);

    // The HomePage content should be visible again
    expect(await screen.findByRole('heading', { name: /home page content/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /dashboard page content/i })).not.toBeInTheDocument();

    // The "Home" link should be active again
    expect(homeLink).toHaveClass('activeLink');
  });

  test('redirects to the HomePage for an unknown route', async () => {
    renderWithInitialRoute('/some/non-existent/path');

    // The user should be redirected to the home page
    expect(await screen.findByRole('heading', { name: /home page content/i })).toBeInTheDocument();

    // The URL in the browser should be updated to "/"
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });

    // The "Home" link should be marked as active
    expect(screen.getByRole('link', { name: /home/i })).toHaveClass('activeLink');
  });

  test('has no accessibility violations on initial render', async () => {
    const { container } = render(<App />);
    // Wait for page content to ensure the full UI is checked
    await screen.findByRole('heading', { name: /home page content/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('has no accessibility violations after navigating to another page', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Navigate to settings
    await user.click(screen.getByRole('link', { name: /settings/i }));
    await screen.findByRole('heading', { name: /settings page content/i });

    // Check for accessibility violations on the new page
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});