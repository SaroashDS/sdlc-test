import React, { useState, useMemo } from 'react';
import styles from './Header.module.css';

// --- SVG Icon Components (for self-containment and performance) ---

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const BellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

// --- Component Definition ---

/**
 * A responsive top navigation bar featuring a mobile menu toggle,
 * user profile, and notification center access. It is designed with a
 * modern, glassmorphic aesthetic.
 */
export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [notificationCount] = useState<number>(3); // Example state

  const handleMenuToggle = (): void => {
    setIsMenuOpen(prev => !prev);
    // In a real application, this would likely trigger a global state change
    // (e.g., via Context or Redux) to open/close a sidebar.
  };

  const user = useMemo(() => ({
    name: 'Alex Hartman',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  }), []);

  return (
    <header className={styles.header} role="banner">
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <button
            className={`${styles.iconButton} ${styles.mobileMenuToggle}`}
            onClick={handleMenuToggle}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation" // This ID should match the main nav element
          >
            <MenuIcon />
          </button>
          <div className={styles.logo}>
            {/* In a real app, this would be a <Link> from a routing library */}
            <a href="/" aria-label="Dashboard Home">
              Project Aurora
            </a>
          </div>
        </div>

        <nav className={styles.rightSection} aria-label="User actions">
          <button
            className={`${styles.iconButton} ${styles.notificationButton}`}
            aria-label={`You have ${notificationCount} new notifications`}
          >
            <BellIcon />
            {notificationCount > 0 && (
              <span className={styles.notificationBadge} aria-hidden="true">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <button className={styles.profileButton} aria-label={`Open profile menu for ${user.name}`}>
            <img
              src={user.avatarUrl}
              alt={`Profile picture of ${user.name}`}
              className={styles.avatar}
            />
            <span className={styles.profileName}>{user.name}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;