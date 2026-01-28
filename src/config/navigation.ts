/**
 * @file src/config/navigation.ts
 * @description Configuration file for sidebar navigation links.
 * This file defines the structure and content of the application's main navigation.
 */

/**
 * Interface representing a single navigation item in the sidebar.
 */
export interface NavigationItem {
  /**
   * The display label for the navigation item.
   */
  label: string;
  /**
   * The URL path or route for the navigation item.
   */
  href: string;
  /**
   * Optional: An icon identifier or path to display next to the label.
   * This could be a string name for an icon library (e.g., 'home', 'settings')
   * or a path to an SVG/image.
   */
  icon?: string;
  /**
   * Optional: An array of child navigation items, creating a nested menu.
   */
  children?: NavigationItem[];
  /**
   * Optional: If true, indicates that the link points to an external URL
   * and should open in a new tab. Defaults to false.
   */
  external?: boolean;
  /**
   * Optional: If true, the navigation item will be displayed but not clickable.
   * Defaults to false.
   */
  disabled?: boolean;
  /**
   * Optional: A unique identifier for the navigation item, useful for testing or tracking.
   */
  id?: string;
}

/**
 * The main configuration array for the application's sidebar navigation.
 * This array defines the top-level navigation items and their potential children.
 */
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard', // Example: 'dashboard' icon
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    icon: 'folder', // Example: 'folder' icon
    children: [
      {
        id: 'all-projects',
        label: 'All Projects',
        href: '/projects',
      },
      {
        id: 'create-project',
        label: 'Create New',
        href: '/projects/new',
      },
      {
        id: 'archived-projects',
        label: 'Archived',
        href: '/projects/archived',
        disabled: true, // Example of a disabled link
      },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    href: '/tasks',
    icon: 'check-square', // Example: 'check-square' icon
  },
  {
    id: 'users',
    label: 'Users',
    href: '/users',
    icon: 'users', // Example: 'users' icon
    children: [
      {
        id: 'user-list',
        label: 'User List',
        href: '/users',
      },
      {
        id: 'roles-permissions',
        label: 'Roles & Permissions',
        href: '/users/roles',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: 'bar-chart', // Example: 'bar-chart' icon
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: 'settings', // Example: 'settings' icon
    children: [
      {
        id: 'general-settings',
        label: 'General',
        href: '/settings/general',
      },
      {
        id: 'profile-settings',
        label: 'Profile',
        href: '/settings/profile',
      },
      {
        id: 'billing-settings',
        label: 'Billing',
        href: '/settings/billing',
      },
    ],
  },
  {
    id: 'help-docs',
    label: 'Help & Docs',
    href: 'https://example.com/docs',
    icon: 'help-circle', // Example: 'help-circle' icon
    external: true, // Example of an external link
  },
];

// Example of how you might use this configuration in a React/Vue/Angular component:
// import { navigationConfig } from '@/config/navigation';
//
// function Sidebar() {
//   return (
//     <nav>
//       {navigationConfig.map((item) => (
//         <div key={item.id || item.href}>
//           <a href={item.href} target={item.external ? '_blank' : '_self'} rel={item.external ? 'noopener noreferrer' : undefined}>
//             {item.icon && <i className={`icon-${item.icon}`}></i>}
//             {item.label}
//           </a>
//           {item.children && (
//             <ul>
//               {item.children.map((child) => (
//                 <li key={child.id || child.href}>
//                   <a href={child.href} disabled={child.disabled}>
//                     {child.label}
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       ))}
//     </nav>
//   );
// }