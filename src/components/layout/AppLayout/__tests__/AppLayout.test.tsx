import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { AppLayout } from './AppLayout';

// Mock CSS modules
jest.mock('./AppLayout.module.css', () => ({
  appLayout: 'appLayout',
  sidebarCollapsed: 'sidebarCollapsed',
  mobileSidebarOpen: 'mobileSidebarOpen',
  mobileOverlay: 'mobileOverlay',
  topbar: 'topbar',
  mobileMenuButton: 'mobileMenuButton',
  topbarTitle: 'topbarTitle',
  sidebar: 'sidebar',
  sidebarHeader: 'sidebarHeader',
  logo: 'logo',
  iconButton: 'iconButton',
  sidebarToggleButton: 'sidebarToggleButton',
  sidebarNav: 'sidebarNav',
  mainContent: 'mainContent',
  userProfile: 'userProfile',
  userDetails: 'userDetails',
  navItem: 'navItem',
}));

describe('AppLayout', () => {
  const TestChildren = () => <div>Main Content Area</div>;

  // Test initial rendering
  test('renders correctly with all main sections and children', () => {
    render(
      <AppLayout>
        <TestChildren />
      </AppLayout>
    );

    // Check for main content
    expect(screen.getByText('Main Content Area')).toBeInTheDocument();

    // Check for topbar elements
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header is a banner
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByAltText('User avatar')).toBeInTheDocument();

    // Check for sidebar elements
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByText('PROJ')).toBeInTheDocument(); // Logo
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders with different types of children', () => {
    const { rerender } = render(<AppLayout>Just a string</AppLayout>);
    expect(screen.getByText('Just a string')).toBeInTheDocument();

    rerender(
      <AppLayout>
        <section>
          <h1>Complex Child</h1>
        </section>
      </AppLayout>
    );
    expect(screen.getByRole('heading', { name: 'Complex Child' })).toBeInTheDocument();
  });

  describe('Desktop Sidebar Functionality', () => {
    test('collapses and expands the sidebar on button click', async () => {
      const user = userEvent.setup();
      render(
        <AppLayout>
          <TestChildren />
        </AppLayout>
      );

      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
      const layoutContainer = collapseButton.closest('.appLayout');

      // Initial state: expanded
      expect(layoutContainer).not.toHaveClass('sidebarCollapsed');
      expect(screen.getByText('PROJ')).toBeVisible();
      expect(screen.getByText('Dashboard')).toBeVisible();
      expect(screen.getByText('Settings')).toBeVisible();

      // Click to collapse
      await user.click(collapseButton);

      // Collapsed state
      expect(layoutContainer).toHaveClass('sidebarCollapsed');
      expect(screen.queryByText('PROJ')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();

      // Click to expand
      const expandButton = screen.getByRole('button', { name: /expand sidebar/i });
      await user.click(expandButton);

      // Expanded state
      expect(layoutContainer).not.toHaveClass('sidebarCollapsed');
      expect(screen.getByText('PROJ')).toBeVisible();
      expect(screen.getByText('Dashboard')).toBeVisible();
      expect(screen.getByText('Settings')).toBeVisible();
      expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
    });
  });

  describe('Mobile Sidebar Functionality', () => {
    test('opens and closes the mobile sidebar on menu button click', async () => {
      const user = userEvent.setup();
      render(
        <AppLayout>
          <TestChildren />
        </AppLayout>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /open navigation menu/i });
      const layoutContainer = mobileMenuButton.closest('.appLayout');

      // Initial state: closed
      expect(layoutContainer).not.toHaveClass('mobileSidebarOpen');
      expect(screen.queryByTestId('mobile-overlay')).not.toBeInTheDocument(); // Assuming overlay has a test-id or is identifiable

      // Click to open
      await user.click(mobileMenuButton);

      // Open state
      expect(layoutContainer).toHaveClass('mobileSidebarOpen');
      // The overlay is just a div, so we can't query by role. Let's check its presence by class.
      const overlay = document.querySelector('.mobileOverlay');
      expect(overlay).toBeInTheDocument();

      // Click to close
      await user.click(mobileMenuButton);

      // Closed state
      expect(layoutContainer).not.toHaveClass('mobileSidebarOpen');
      expect(document.querySelector('.mobileOverlay')).not.toBeInTheDocument();
    });

    test('closes the mobile sidebar when the overlay is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AppLayout>
          <TestChildren />
        </AppLayout>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /open navigation menu/i });
      const layoutContainer = mobileMenuButton.closest('.appLayout');

      // Open the sidebar first
      await user.click(mobileMenuButton);
      expect(layoutContainer).toHaveClass('mobileSidebarOpen');

      // Click the overlay to close
      const overlay = document.querySelector('.mobileOverlay');
      expect(overlay).toBeInTheDocument();
      await user.click(overlay!); // The '!' asserts that overlay is not null

      // Check if it's closed
      expect(layoutContainer).not.toHaveClass('mobileSidebarOpen');
      expect(document.querySelector('.mobileOverlay')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations in the default state', async () => {
      const { container } = render(
        <AppLayout>
          <TestChildren />
        </AppLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has no accessibility violations when sidebar is collapsed', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <AppLayout>
          <TestChildren />
        </AppLayout>
      );
      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(collapseButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has no accessibility violations when mobile sidebar is open', async () => {
        const user = userEvent.setup();
        const { container } = render(
          <AppLayout>
            <TestChildren />
          </AppLayout>
        );
        const mobileMenuButton = screen.getByRole('button', { name: /open navigation menu/i });
        await user.click(mobileMenuButton);
  
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

    test('updates ARIA attributes correctly on interaction', async () => {
      const user = userEvent.setup();
      render(
        <AppLayout>
          <TestChildren />
        </AppLayout>
      );

      // Test sidebar collapse/expand button
      const sidebarToggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(sidebarToggleButton).toHaveAttribute('aria-expanded', 'true');
      await user.click(sidebarToggleButton);
      expect(sidebarToggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(sidebarToggleButton).toHaveAttribute('aria-label', 'Expand sidebar');
      await user.click(sidebarToggleButton);
      expect(sidebarToggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(sidebarToggleButton).toHaveAttribute('aria-label', 'Collapse sidebar');

      // Test mobile menu button
      const mobileMenuButton = screen.getByRole('button', { name: /open navigation menu/i });
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
      expect(mobileMenuButton).toHaveAttribute('aria-controls', 'app-sidebar');
      await user.click(mobileMenuButton);
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
      await user.click(mobileMenuButton);
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('main content area has tabIndex of -1', () => {
        render(<AppLayout><TestChildren /></AppLayout>);
        // The <main> element has an implicit role of 'main'
        expect(screen.getByRole('main')).toHaveAttribute('tabIndex', '-1');
    });
  });
});