import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Header } from './Header';

// Extend Jest's expect with jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Header Component', () => {
  // Setup userEvent for more realistic user interactions
  const setup = () => {
    const user = userEvent.setup();
    const renderResult = render(<Header />);
    return { user, ...renderResult };
  };

  describe('Rendering and Initial State', () => {
    it('should render the header with the banner role', () => {
      setup();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render the logo with the correct text and link', () => {
      setup();
      const logoLink = screen.getByRole('link', { name: /dashboard home/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
      expect(logoLink).toHaveTextContent('Project Aurora');
    });

    it('should render the mobile menu toggle button in its initial closed state', () => {
      setup();
      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'main-navigation');
    });

    it('should render the notification button with the initial count', () => {
      setup();
      const notificationButton = screen.getByRole('button', { name: /you have 3 new notifications/i });
      expect(notificationButton).toBeInTheDocument();
    });

    it('should display the notification badge with the correct count', () => {
      setup();
      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('aria-hidden', 'true');
      expect(badge).toHaveClass('notificationBadge');
    });

    it('should render the user profile section with avatar and name', () => {
      setup();
      const profileButton = screen.getByRole('button', { name: /open profile menu for alex hartman/i });
      expect(profileButton).toBeInTheDocument();

      const avatar = screen.getByRole('img', { name: /profile picture of alex hartman/i });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://i.pravatar.cc/150?u=a042581f4e29026704d');

      expect(screen.getByText('Alex Hartman')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should toggle the aria-expanded attribute on the menu button when clicked', async () => {
      const { user } = setup();
      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });

      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');

      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    // Although the buttons don't have functionality in this isolated component,
    // we can test that they are not disabled and are clickable.
    it('should allow clicking on the notification button', async () => {
      const { user } = setup();
      const notificationButton = screen.getByRole('button', { name: /you have 3 new notifications/i });
      expect(notificationButton).not.toBeDisabled();
      await user.click(notificationButton);
      // No state change to assert, but this confirms it's interactive
    });

    it('should allow clicking on the profile button', async () => {
      const { user } = setup();
      const profileButton = screen.getByRole('button', { name: /open profile menu for alex hartman/i });
      expect(profileButton).not.toBeDisabled();
      await user.click(profileButton);
      // No state change to assert, but this confirms it's interactive
    });
  });

  describe('Notification State Variations', () => {
    // We can mock useState to test different notification counts
    let useStateMock: jest.SpyInstance;

    beforeEach(() => {
      useStateMock = jest.spyOn(React, 'useState');
    });

    afterEach(() => {
      useStateMock.mockRestore();
    });

    it('should not display a notification badge when the count is 0', () => {
      // Mock the second useState call (for notificationCount) to return 0
      useStateMock
        .mockImplementationOnce((initial) => [initial, jest.fn()]) // isMenuOpen
        .mockImplementationOnce(() => [0, jest.fn()]); // notificationCount

      render(<Header />);

      const notificationButton = screen.getByRole('button', { name: /you have 0 new notifications/i });
      expect(notificationButton).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
      expect(document.querySelector('.notificationBadge')).not.toBeInTheDocument();
    });

    it('should display "9+" in the badge when the count is greater than 9', () => {
      useStateMock
        .mockImplementationOnce((initial) => [initial, jest.fn()])
        .mockImplementationOnce(() => [15, jest.fn()]);

      render(<Header />);

      const notificationButton = screen.getByRole('button', { name: /you have 15 new notifications/i });
      expect(notificationButton).toBeInTheDocument();

      const badge = screen.getByText('9+');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('aria-hidden', 'true');
    });

    it('should display the exact count when it is between 1 and 9', () => {
        useStateMock
          .mockImplementationOnce((initial) => [initial, jest.fn()])
          .mockImplementationOnce(() => [7, jest.fn()]);
  
        render(<Header />);
  
        const notificationButton = screen.getByRole('button', { name: /you have 7 new notifications/i });
        expect(notificationButton).toBeInTheDocument();
  
        const badge = screen.getByText('7');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute('aria-hidden', 'true');
      });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Header />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have a navigation role for the right section', () => {
        setup();
        expect(screen.getByRole('navigation', { name: /user actions/i })).toBeInTheDocument();
    });

    it('should have descriptive aria-labels for all icon buttons', () => {
        setup();
        expect(screen.getByRole('button', { name: /toggle navigation menu/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /you have 3 new notifications/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /open profile menu for alex hartman/i })).toBeInTheDocument();
    });
  });
});