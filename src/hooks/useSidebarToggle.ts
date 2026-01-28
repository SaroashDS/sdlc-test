import { useState, useCallback } from 'react';

/**
 * The return type for the useSidebarToggle hook.
 */
interface UseSidebarToggleReturn {
  /** The current open/closed state of the sidebar. `true` for open, `false` for closed. */
  isOpen: boolean;
  /** A memoized function to set the sidebar state to open (`true`). */
  openSidebar: () => void;
  /** A memoized function to set the sidebar state to closed (`false`). */
  closeSidebar: () => void;
  /** A memoized function to toggle the sidebar's state between open and closed. */
  toggleSidebar: () => void;
}

/**
 * A custom hook to manage the open/closed state of a mobile sidebar.
 * It provides the current state and memoized functions to open, close, and toggle the sidebar.
 *
 * @param {boolean} [initialState=false] - The initial state of the sidebar. Defaults to `false` (closed).
 * @returns {UseSidebarToggleReturn} An object containing the sidebar state and handler functions.
 *
 * @example
 * const { isOpen, toggleSidebar, openSidebar } = useSidebarToggle();
 *
 * return (
 *   <>
 *     <button onClick={toggleSidebar}>Toggle Menu</button>
 *     <button onClick={openSidebar}>Open Menu</button>
 *     {isOpen && <div className="sidebar">...</div>}
 *   </>
 * );
 */
export const useSidebarToggle = (initialState: boolean = false): UseSidebarToggleReturn => {
  if (typeof initialState !== 'boolean') {
    console.error('useSidebarToggle: initialState must be a boolean. Defaulting to false.');
    initialState = false;
  }

  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  /**
   * Opens the sidebar by setting the `isOpen` state to `true`.
   * This function is memoized with `useCallback` for performance optimization.
   */
  const openSidebar = useCallback((): void => {
    setIsOpen(true);
  }, []);

  /**
   * Closes the sidebar by setting the `isOpen` state to `false`.
   * This function is memoized with `useCallback` for performance optimization.
   */
  const closeSidebar = useCallback((): void => {
    setIsOpen(false);
  }, []);

  /**
   * Toggles the sidebar state. If it's open, it will be closed, and vice versa.
   * This function is memoized with `useCallback` for performance optimization.
   */
  const toggleSidebar = useCallback((): void => {
    setIsOpen(prev => !prev);
  }, []);

  return { isOpen, openSidebar, closeSidebar, toggleSidebar };
};