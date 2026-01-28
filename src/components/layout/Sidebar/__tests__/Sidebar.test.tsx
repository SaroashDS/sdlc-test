import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import '@testing-library/jest-dom';

import { Sidebar } from './Sidebar';

// Mock the CSS module to prevent errors and allow class name checks
jest.mock('./Sidebar.module.css', () => ({
  sidebar: 'sidebar',
  branding: 'branding',
  logo: 'logo',
  appName: 'appName',
  navList: 'navList',
  navItem: 'navItem',
  navLink: 'navLink',
  active: 'active',
  navIcon: 'navIcon',
  navLabel: 'navLabel',
  profile: 'profile',
  profileAvatar: 'profileAvatar',
  profileInfo: 'profileInfo',
  profileName: 'profileName',
  profileRole: 'profileRole',
}));

// Mock data to ensure tests are not dependent on the component's internal constants
const MOCK_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
  { id: 'products', label: 'Products', href: '/products' },
  { id: 'settings', label: 'Settings', href: '/settings' },
];

describe('Sidebar', () => {
  
  beforeEach(() => {
    render(<Sidebar />);
  });

  describe('Rendering and Initial State', () => {
    it('should render the component without crashing', () => {
      expect(screen.getByRole('navigation', { name: 'Main Navigation' })).toBeInTheDocument();
    });

    it('should display the application branding', () => {
      expect(screen.getByText('Aura Inc.')).toBeInTheDocument();
    });

    it('should render all navigation links', () => {
      MOCK_NAV_ITEMS.forEach(item => {
        const link = screen.getByRole('link', { name: new RegExp(item.label, 'i') });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', item.href);
      });
    });

    it('should render the user profile section', () => {
      expect(screen.getByAltText('User avatar')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Sr. Architect')).toBeInTheDocument();
    });

    it('should set the "Dashboard" link as active by default', () => {
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('active');
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('should not set other links as active by default', () => {
      const analyticsLink = screen.getByRole('link', { name: /analytics/i });
      expect(analyticsLink).not.toHaveClass('active');
      expect(analyticsLink).not.toHaveAttribute('aria-current', 'page');

      const productsLink = screen.getByRole('link', { name: /products/i });
      expect(productsLink).not.toHaveClass('active');
      expect(productsLink).not.toHaveAttribute('aria-current', 'page');
    });
  });

  describe('User Interactions', () => {
    it('should change the active link when a user clicks on a different navigation item', async () => {
      const user = userEvent.setup();
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const analyticsLink = screen.getByRole('link', { name: /analytics/i });

      // Initial state check
      expect(dashboardLink).toHaveClass('active');
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
      expect(analyticsLink).not.toHaveClass('active');
      expect(analyticsLink).not.toHaveAttribute('aria-current', 'page');

      // Click the 'Analytics' link
      await user.click(analyticsLink);

      // Verify state after click
      expect(analyticsLink).toHaveClass('active');
      expect(analyticsLink).toHaveAttribute('aria-current', 'page');
      expect(dashboardLink).not.toHaveClass('active');
      expect(dashboardLink).not.toHaveAttribute('aria-current', 'page');
    });

    it('should keep the link active when it is clicked again', async () => {
        const user = userEvent.setup();
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
  
        // Initial state check
        expect(dashboardLink).toHaveClass('active');
        expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  
        // Click the already active link
        await user.click(dashboardLink);
  
        // Verify state remains the same
        expect(dashboardLink).toHaveClass('active');
        expect(dashboardLink).toHaveAttribute('aria-current', 'page');
      });

    it('should prevent default navigation behavior on link click', () => {
        // This test verifies the e.preventDefault() call.
        // We can't directly check if the browser navigated, but we can spy on the event.
        const analyticsLink = screen.getByRole('link', { name: /analytics/i });
        
        let defaultPrevented = false;
        fireEvent(analyticsLink, new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            // A simple way to check if preventDefault was called
            preventDefault: () => { defaultPrevented = true; },
        }));

        expect(defaultPrevented).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Sidebar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have a main navigation landmark with an accessible name', () => {
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main Navigation');
    });

    it('should use aria-current="page" to identify the active link', async () => {
        const user = userEvent.setup();
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
        const settingsLink = screen.getByRole('link', { name: /settings/i });
  
        // Check initial state
        expect(dashboardLink).toHaveAttribute('aria-current', 'page');
        expect(settingsLink).not.toHaveAttribute('aria-current');
  
        // Click another link
        await user.click(settingsLink);
  
        // Check updated state
        expect(settingsLink).toHaveAttribute('aria-current', 'page');
        expect(dashboardLink).not.toHaveAttribute('aria-current');
      });

    it('should provide an accessible name for the user avatar image', () => {
        const avatar = screen.getByRole('img');
        expect(avatar).toHaveAccessibleName('User avatar');
    });
  });
});