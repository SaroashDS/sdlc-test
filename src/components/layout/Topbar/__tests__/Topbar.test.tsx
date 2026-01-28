import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Topbar from './Topbar';

// Mock data from the component to be used in tests for verification
const mockUser = {
  name: 'Elena Petrova',
  avatarUrl: 'https://i.pravatar.cc/150?u=elena',
  role: 'Architect',
};

const mockNotifications = [
  { id: 'n1', text: 'New feature deployed: AI-powered search.', timestamp: '2m ago', read: false },
  { id: 'n2', text: 'Your monthly performance report is ready.', timestamp: '1h ago', read: false },
  { id: 'n3', text: 'Team meeting scheduled for 3:00 PM.', timestamp: 'Yesterday', read: true },
];

describe('Topbar', () => {
  const setup = () => {
    const user = userEvent.setup();
    render(<Topbar />);
    return { user };
  };

  describe('Initial Rendering and Accessibility', () => {
    it('should render the header with a banner role', () => {
      setup();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should display the project logo placeholder', () => {
      setup();
      expect(screen.getByText('Project')).toBeInTheDocument();
    });

    it('should display the user name and role', () => {
      setup();
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser.role)).toBeInTheDocument();
    });

    it('should display the user avatar with correct accessible name', () => {
      setup();
      const avatar = screen.getByRole('img', { name: `Avatar for ${mockUser.name}` });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', mockUser.avatarUrl);
    });

    it('should display the notification bell and the unread count badge', () => {
      setup();
      const unreadCount = mockNotifications.filter(n => !n.read).length;
      expect(screen.getByLabelText(`View notifications (${unreadCount} unread)`)).toBeInTheDocument();
      expect(screen.getByText(unreadCount.toString())).toBeInTheDocument();
      expect(screen.getByText(unreadCount.toString())).toHaveClass('notificationBadge');
    });

    it('should have both dropdowns hidden initially', () => {
      setup();
      expect(screen.queryByRole('region', { name: /notifications/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should have correct ARIA attributes on interactive elements on initial render', () => {
      setup();
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
      expect(notificationsButton).toHaveAttribute('aria-controls', 'notifications-panel');

      const userMenuButton = screen.getByRole('button', { name: `Open user menu for ${mockUser.name}` });
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
      expect(userMenuButton).toHaveAttribute('aria-controls', 'user-menu-panel');
    });
  });

  describe('Notifications Dropdown Interaction', () => {
    it('should open and close the notifications dropdown on button click', async () => {
      const { user } = setup();
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });

      // Open
      await user.click(notificationsButton);
      const dropdown = screen.getByRole('region', { name: /notifications/i });
      expect(dropdown).toBeVisible();
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');

      // Close
      await user.click(notificationsButton);
      expect(screen.queryByRole('region', { name: /notifications/i })).not.toBeInTheDocument();
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should display all notifications with correct content and status when open', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: /view notifications/i }));

      const dropdown = screen.getByRole('region', { name: /notifications/i });
      expect(within(dropdown).getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();

      const notificationItems = within(dropdown).getAllByRole('listitem');
      expect(notificationItems).toHaveLength(mockNotifications.length);

      // Check content of each notification
      mockNotifications.forEach(notification => {
        expect(within(dropdown).getByText(notification.text)).toBeInTheDocument();
        expect(within(dropdown).getByText(notification.timestamp)).toBeInTheDocument();
      });

      // Check read/unread styles
      const unreadItem = within(dropdown).getByText(mockNotifications[0].text).closest('li');
      const readItem = within(dropdown).getByText(mockNotifications[2].text).closest('li');
      expect(unreadItem).not.toHaveClass('read');
      expect(readItem).toHaveClass('read');
    });

    it('should close the notifications dropdown when clicking outside', async () => {
      const { user } = setup();
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });

      await user.click(notificationsButton);
      expect(screen.getByRole('region', { name: /notifications/i })).toBeVisible();

      await user.click(document.body);
      expect(screen.queryByRole('region', { name: /notifications/i })).not.toBeInTheDocument();
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('User Menu Dropdown Interaction', () => {
    it('should open and close the user menu dropdown on button click', async () => {
      const { user } = setup();
      const userMenuButton = screen.getByRole('button', { name: `Open user menu for ${mockUser.name}` });

      // Open
      await user.click(userMenuButton);
      const dropdown = screen.getByRole('menu');
      expect(dropdown).toBeVisible();
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');

      // Close
      await user.click(userMenuButton);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should display all user menu items when open', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: `Open user menu for ${mockUser.name}` }));

      const menu = screen.getByRole('menu');
      expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
      expect(within(menu).getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
      expect(within(menu).getByRole('menuitem', { name: 'Logout' })).toBeInTheDocument();
      expect(within(menu).getByRole('separator')).toBeInTheDocument();
    });

    it('should close the user menu dropdown when clicking outside', async () => {
      const { user } = setup();
      const userMenuButton = screen.getByRole('button', { name: `Open user menu for ${mockUser.name}` });

      await user.click(userMenuButton);
      expect(screen.getByRole('menu')).toBeVisible();

      await user.click(document.body);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Dropdown Interoperability', () => {
    it('should close the user menu when the notifications dropdown is opened', async () => {
      const { user } = setup();
      const userMenuButton = screen.getByRole('button', { name: `Open user menu for ${mockUser.name}` });
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });

      // 1. Open user menu
      await user.click(userMenuButton);
      expect(screen.getByRole('menu')).toBeVisible();
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');

      // 2. Open notifications menu
      await user.click(notificationsButton);

      // Assert user menu is now closed and notifications menu is open
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('region', { name: /notifications/i })).toBeVisible();
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should close the notifications dropdown when the user menu is opened', async () => {
      const { user } = setup();
      const userMenuButton = screen.getByRole('button', { name: `Open user menu for ${mockUser.name}` });
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });

      // 1. Open notifications menu
      await user.click(notificationsButton);
      expect(screen.getByRole('region', { name: /notifications/i })).toBeVisible();
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');

      // 2. Open user menu
      await user.click(userMenuButton);

      // Assert notifications menu is now closed and user menu is open
      expect(screen.queryByRole('region', { name: /notifications/i })).not.toBeInTheDocument();
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('menu')).toBeVisible();
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
});