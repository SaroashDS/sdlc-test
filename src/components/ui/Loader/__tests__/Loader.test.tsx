import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import Loader from './Loader';

// Mock the CSS module to prevent errors during testing
jest.mock('./Loader.module.css', () => ({
  loaderWrapper: 'loaderWrapper',
  spinner: 'spinner',
  visuallyHidden: 'visuallyHidden',
}));

describe('Loader Component', () => {
  /**
   * Test 1: Basic Rendering
   * Ensures the component renders without crashing and the main wrapper is present.
   */
  it('should render the loader component without crashing', () => {
    render(<Loader />);
    const loaderElement = screen.getByRole('status');
    expect(loaderElement).toBeInTheDocument();
  });

  /**
   * Test 2: Accessibility - ARIA Role
   * Verifies that the component has the correct role for accessibility,
   * which informs screen readers about a dynamic content change.
   */
  it('should have a role of "status" for accessibility', () => {
    render(<Loader />);
    const loaderElement = screen.getByRole('status');
    expect(loaderElement).toBeInTheDocument();
  });

  /**
   * Test 3: Accessibility - Screen Reader Text
   * Checks for the presence of visually hidden text that provides a
   * textual alternative for the visual spinner for screen reader users.
   */
  it('should render the accessible "Loading..." text for screen readers', () => {
    render(<Loader />);
    const accessibleText = screen.getByText('Loading...');
    expect(accessibleText).toBeInTheDocument();
  });

  /**
   * Test 4: Visual Elements - Spinner
   * Ensures the visual spinner element is rendered.
   */
  it('should render the visual spinner element', () => {
    render(<Loader />);
    const loaderElement = screen.getByRole('status');
    // The spinner is a child div of the main wrapper.
    // We can check for its existence and class.
    const spinnerElement = loaderElement.querySelector('.spinner');
    expect(spinnerElement).toBeInTheDocument();
  });

  /**
   * Test 5: Accessibility - Hiding Visuals from Screen Readers
   * Verifies that the animated spinner element is hidden from screen readers
   * to avoid redundant announcements, as the "Loading..." text is sufficient.
   */
  it('should hide the visual spinner element from screen readers with aria-hidden="true"', () => {
    render(<Loader />);
    const loaderElement = screen.getByRole('status');
    const spinnerElement = loaderElement.querySelector('.spinner');
    expect(spinnerElement).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * Test 6: CSS Classes
   * Verifies that the correct CSS module classes are applied to the elements
   * for proper styling.
   */
  it('should apply the correct CSS classes for styling', () => {
    render(<Loader />);
    const wrapperElement = screen.getByRole('status');
    const accessibleText = screen.getByText('Loading...');
    const spinnerElement = wrapperElement.querySelector('div');

    expect(wrapperElement).toHaveClass('loaderWrapper');
    expect(spinnerElement).toHaveClass('spinner');
    expect(accessibleText).toHaveClass('visuallyHidden');
  });

  /**
   * Test 7: No Props Functionality
   * Since the component accepts no props, this test confirms it renders
   * correctly in its default and only state.
   */
  it('should render correctly without any props', () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  /**
   * Test 8: Automated Accessibility Audit
   * Runs the axe-core accessibility testing engine on the component to
   * catch any potential accessibility violations automatically.
   */
  it('should have no accessibility violations', async () => {
    const { container } = render(<Loader />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});