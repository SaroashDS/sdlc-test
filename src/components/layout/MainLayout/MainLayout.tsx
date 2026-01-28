import React from 'react';
import styles from './MainLayout.module.css';

// --- Type Definitions ---

interface MainLayoutProps {
  /**
   * The main content to be rendered within the layout's content area.
   * This is typically the page-specific component.
   */
  children: React.ReactNode;
}

// --- Placeholder Components (for demonstration) ---
// In a production application, these would be imported from their own files.

const PlaceholderHeaderContent: React.FC = () => (
  <div className={styles.placeholderContent}>
    <h1>Dashboard</h1>
    <p>Welcome back, Architect!</p>
  </div>
);

const PlaceholderSidebarContent: React.FC = () => (
  <div className={styles.placeholderContent}>
    <h2>ProjectX</h2>
    <nav>
      <ul>
        <li>Dashboard</li>
        <li>Analytics</li>
        <li>Settings</li>
        <li>Support</li>
      </ul>
    </nav>
  </div>
);

// --- Main Component ---

/**
 * The MainLayout component provides the primary application shell.
 * It uses CSS Grid to orchestrate a responsive layout with a fixed sidebar,
 * a glassmorphism header, and a main content area.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className={styles.gridContainer}>
      <header className={styles.header} role="banner" aria-label="Page Header">
        {/* In a real app, you would import and render a <Header /> component here */}
        <PlaceholderHeaderContent />
      </header>

      <aside className={styles.sidebar} role="complementary" aria-label="Main Navigation">
        {/* In a real app, you would import and render a <Sidebar /> component here */}
        <PlaceholderSidebarContent />
      </aside>

      <main id="main-content" className={styles.mainContent} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;