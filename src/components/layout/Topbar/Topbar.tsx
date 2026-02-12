import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Topbar.module.css';

// --- TYPE DEFINITIONS ---
// For strict typing and future prop expansion
interface TopbarProps {}

interface User {
  name: string;
  avatarUrl: string;
  role: string;
}

interface Notification {
  id: string;
  text: string;
  timestamp: string;
  read: boolean;
}

// --- MOCK DATA ---
// In a real application, this data would come from props or a global state manager.
const mockUser: User = {
  name: 'Elena Petrova',
  avatarUrl: 'https://i.pravatar.cc/150?u=elena',
  role: 'Architect',
};

const mockNotifications: Notification[] = [
  { id: 'n1', text: 'New feature deployed: AI-powered search.', timestamp: '2m ago', read: false },
  { id: 'n2', text: 'Your monthly performance report is ready.', timestamp: '1h ago', read: false },
  { id: 'n3', text: 'Team meeting scheduled for 3:00 PM.', timestamp: 'Yesterday', read: true },
];

// --- HELPER HOOK ---
// A reusable hook to detect clicks outside a referenced element.
const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};


// --- SVG ICONS ---
// Using inline SVG components for clarity and zero dependencies.
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);


// --- MAIN COMPONENT ---
const Topbar: React.FC<TopbarProps> = () => {
  const [user, setUser] = useState<User>(mockUser);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Use useCallback to memoize the handler functions
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);

  useClickOutside(notificationsRef, closeNotifications);
  useClickOutside(userMenuRef, closeUserMenu);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleNotifications = () => {
    setNotificationsOpen(prev => !prev);
    setUserMenuOpen(false); // Close other dropdown
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(prev => !prev);
    setNotificationsOpen(false); // Close other dropdown
  };

  return (
    <header className={styles.topbar} role="banner">
      <div className={styles.logoPlaceholder}>
        {/* In a real app, a logo component would go here */}
        <span>Project</span>
      </div>

      <nav className={styles.actions} aria-label="Global actions">
        {/* Notifications Section */}
        <div className={styles.actionItemWrapper} ref={notificationsRef}>
          <button
            className={styles.iconButton}
            onClick={toggleNotifications}
            aria-label={`View notifications (${unreadCount} unread)`}
            aria-expanded={isNotificationsOpen}
            aria-controls="notifications-panel"
          >
            <BellIcon />
            {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
          </button>

          {isNotificationsOpen && (
            <div id="notifications-panel" className={styles.dropdownPanel} role="region">
              <div className={styles.dropdownHeader}>
                <h3>Notifications</h3>
              </div>
              <ul className={styles.notificationList}>
                {notifications.map(n => (
                  <li key={n.id} className={`${styles.notificationItem} ${n.read ? styles.read : ''}`}>
                    <p className={styles.notificationText}>{n.text}</p>
                    <span className={styles.notificationTime}>{n.timestamp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className={styles.actionItemWrapper} ref={userMenuRef}>
          <button
            className={styles.userProfileButton}
            onClick={toggleUserMenu}
            aria-label={`Open user menu for ${user.name}`}
            aria-expanded={isUserMenuOpen}
            aria-controls="user-menu-panel"
          >
            <img src={user.avatarUrl} alt={`Avatar for ${user.name}`} className={styles.avatar} />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>{user.role}</span>
            </div>
            <ChevronDownIcon />
          </button>

          {isUserMenuOpen && (
            <div id="user-menu-panel" className={styles.dropdownPanel} role="menu">
              <ul className={styles.userMenuList}>
                <li role="none"><a href="#" className={styles.userMenuItem} role="menuitem">Profile</a></li>
                <li role="none"><a href="#" className={styles.userMenuItem} role="menuitem">Settings</a></li>
                <li role="none"><hr className={styles.menuDivider} /></li>
                <li role="none"><a href="#" className={styles.userMenuItem} role="menuitem">Logout</a></li>
              </ul>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Topbar;