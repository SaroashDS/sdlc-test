import React, { useState, useCallback, FC, ReactNode } from 'react';
import styles from './AppLayout.module.css';

// --- PROPS & TYPES --- //

interface AppLayoutProps {
  /** The main content of the application to be rendered within the layout. */
  children: ReactNode;
}

// --- MOCK CHILD COMPONENTS (for demonstration) --- //
// In a real application, these would be imported from their own files.

const UserProfile: FC = () => (
  <div className={styles.userProfile}>
    <img src="https://i.pravatar.cc/40?u=a042581f4e29026704d" alt="User avatar" />
    <div className={styles.userDetails}>
      <span>Jane Doe</span>
      <small>Senior Architect</small>
    </div>
  </div>
);

const NavItem: FC<{ icon: ReactNode; label: string; isCollapsed: boolean }> = ({ icon, label, isCollapsed }) => (
  <a href="#" className={styles.navItem}>
    {icon}
    {!isCollapsed && <span>{label}</span>}
  </a>
);

// --- SVG ICONS (for self-containment) --- //
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const ChevronLeftIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const HomeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const SettingsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

// --- MAIN COMPONENT --- //

/**
 * Main layout component that orchestrates a responsive Sidebar, Topbar, and content area.
 * It uses CSS Grid for robust positioning and is fully responsive.
 */
export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(prevState => !prevState);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(prevState => !prevState);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const layoutClasses = [
    styles.appLayout,
    isSidebarCollapsed ? styles.sidebarCollapsed : '',
    isMobileSidebarOpen ? styles.mobileSidebarOpen : ''
  ].join(' ');

  return (
    <div className={layoutClasses}>
      {isMobileSidebarOpen && <div className={styles.mobileOverlay} onClick={closeMobileSidebar} />}
      
      <header className={styles.topbar}>
        <button 
          className={`${styles.iconButton} ${styles.mobileMenuButton}`} 
          onClick={toggleMobileSidebar}
          aria-label="Open navigation menu"
          aria-controls="app-sidebar"
          aria-expanded={isMobileSidebarOpen}
        >
          <MenuIcon />
        </button>
        <h1 className={styles.topbarTitle}>Dashboard</h1>
        <div style={{ marginLeft: 'auto' }}>
          <UserProfile />
        </div>
      </header>

      <aside id="app-sidebar" className={styles.sidebar} role="navigation" aria-label="Main Navigation">
        <div className={styles.sidebarHeader}>
          {!isSidebarCollapsed && <span className={styles.logo}>PROJ</span>}
          <button 
            className={`${styles.iconButton} ${styles.sidebarToggleButton}`} 
            onClick={toggleSidebarCollapse}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isSidebarCollapsed}
          >
            <ChevronLeftIcon />
          </button>
        </div>
        <nav className={styles.sidebarNav}>
          <NavItem icon={<HomeIcon />} label="Dashboard" isCollapsed={isSidebarCollapsed} />
          <NavItem icon={<SettingsIcon />} label="Settings" isCollapsed={isSidebarCollapsed} />
        </nav>
      </aside>

      <main className={styles.mainContent} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;