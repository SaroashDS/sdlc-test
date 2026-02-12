import { renderHook, act } from '@testing-library/react';
import { useSidebarToggle } from './useSidebarToggle'; // Adjust the import path as needed

describe('useSidebarToggle', () => {
  // Spy on console.error to test error logging without polluting the test output
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console.error before each test
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore the original console.error function after each test
    consoleErrorSpy.mockRestore();
  });

  describe('Initial State', () => {
    it('should initialize with isOpen as false by default', () => {
      const { result } = renderHook(() => useSidebarToggle());
      expect(result.current.isOpen).toBe(false);
    });

    it('should initialize with isOpen as false when explicitly passed false', () => {
      const { result } = renderHook(() => useSidebarToggle(false));
      expect(result.current.isOpen).toBe(false);
    });

    it('should initialize with isOpen as true when explicitly passed true', () => {
      const { result } = renderHook(() => useSidebarToggle(true));
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('Actions', () => {
    it('should set isOpen to true when openSidebar is called', () => {
      const { result } = renderHook(() => useSidebarToggle(false));

      act(() => {
        result.current.openSidebar();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should set isOpen to false when closeSidebar is called', () => {
      const { result } = renderHook(() => useSidebarToggle(true));

      act(() => {
        result.current.closeSidebar();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should toggle isOpen from false to true when toggleSidebar is called', () => {
      const { result } = renderHook(() => useSidebarToggle(false));

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should toggle isOpen from true to false when toggleSidebar is called', () => {
      const { result } = renderHook(() => useSidebarToggle(true));

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('State Stability and Memoization', () => {
    it('should remain open when openSidebar is called multiple times', () => {
      const { result } = renderHook(() => useSidebarToggle(false));

      act(() => {
        result.current.openSidebar();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.openSidebar();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it('should remain closed when closeSidebar is called multiple times', () => {
      const { result } = renderHook(() => useSidebarToggle(true));

      act(() => {
        result.current.closeSidebar();
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.closeSidebar();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('should maintain stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useSidebarToggle());

      const initialFunctions = {
        openSidebar: result.current.openSidebar,
        closeSidebar: result.current.closeSidebar,
        toggleSidebar: result.current.toggleSidebar,
      };

      // Trigger a re-render by changing state
      act(() => {
        result.current.toggleSidebar();
      });

      // Rerender the hook
      rerender();

      // Check if the function references are the same
      expect(result.current.openSidebar).toBe(initialFunctions.openSidebar);
      expect(result.current.closeSidebar).toBe(initialFunctions.closeSidebar);
      expect(result.current.toggleSidebar).toBe(initialFunctions.toggleSidebar);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    // Use test.each to test multiple invalid input types efficiently
    test.each([
      ['a string', 'true'],
      ['a number', 123],
      ['an object', {}],
      ['an array', []],
      ['null', null],
      ['undefined', undefined],
    ])('should default to false and log an error when initialState is %s', (_, invalidInitialState) => {
      // The type assertion is needed because we are intentionally passing an invalid type
      const { result } = renderHook(() => useSidebarToggle(invalidInitialState as any));

      // Expect the state to default to false
      expect(result.current.isOpen).toBe(false);

      // Expect console.error to have been called once with the specific message
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'useSidebarToggle: initialState must be a boolean. Defaulting to false.'
      );
    });

    it('should not log an error when no initial state is provided', () => {
      renderHook(() => useSidebarToggle());
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should not log an error when a valid boolean initial state is provided', () => {
      renderHook(() => useSidebarToggle(true));
      renderHook(() => useSidebarToggle(false));
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});