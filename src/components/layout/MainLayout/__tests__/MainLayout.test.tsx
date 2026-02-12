import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MainLayout } from './MainLayout';

// A more complex child component for testing purposes
const SamplePageContent: React.FC = () => (
  <div>
    <h2>Page Title</h2>
    <p>This is the main content of the page.</p>
    <button type="button">Click Me</button>
  </div>
);

describe('MainLayout', () => {
  // --- Basic Rendering Tests ---

  it('should render all core layout sections: header, sidebar, and main content', () => {
    render(
      <MainLayout>
        <div>Child Content</div>
      </MainLayout>
    );

    // Check for the header by its role
    const header = screen.getByRole('banner', { name: /page header/i });
    expect(header).toBeInTheDocument();

    // Check for the sidebar by its role
    const sidebar = screen.getByRole('complementary', { name: /main navigation/i });
    expect(sidebar).toBeInTheDocument();

    // Check for the main content area by its role
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
  });

  it('should render the placeholder content within the header and sidebar', () => {
    render(
      <MainLayout>
        <div>Child Content</div>
      </MainLayout>
    );

    // Verify header placeholder content
    expect(screen.getByRole('heading', { name: /dashboard/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/welcome back, architect!/i)).toBeInTheDocument();

    // Verify sidebar placeholder content
    expect(screen.getByRole('heading', { name: /projectx/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  // --- Prop Combination Tests (children) ---

  it('should render simple string children inside the main content area', () => {
    const childText = 'This is the main content as a string.';
    render(<MainLayout>{childText}</MainLayout>);

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveTextContent(childText);
  });

  it('should render a single React element as a child', () => {
    render(
      <MainLayout>
        <h1>Main Content Title</h1>
      </MainLayout>
    );

    const mainContent = screen.getByRole('main');
    const childHeading = screen.getByRole('heading', { name: /main content title/i, level: 1 });
    expect(mainContent).toContainElement(childHeading);
  });

  it('should render multiple React elements as children', () => {
    render(
      <MainLayout>
        <p>First paragraph.</p>
        <p>Second paragraph.</p>
      </MainLayout>
    );

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveTextContent('First paragraph.');
    expect(mainContent).toHaveTextContent('Second paragraph.');
  });

  it('should render a complex component as children', () => {
    render(
      <MainLayout>
        <SamplePageContent />
      </MainLayout>
    );

    const mainContent = screen.getByRole('main');
    const childHeading = screen.getByRole('heading', { name: /page title/i, level: 2 });
    const childButton = screen.getByRole('button', { name: /click me/i });

    expect(mainContent).toContainElement(childHeading);
    expect(mainContent).toContainElement(childButton);
    expect(screen.getByText('This is the main content of the page.')).toBeInTheDocument();
  });

  // --- Accessibility Tests ---

  it('should have correct ARIA roles and attributes for landmark regions', () => {
    render(
      <MainLayout>
        <div>Child Content</div>
      </MainLayout>
    );

    // Header landmark
    const header = screen.getByRole('banner');
    expect(header).toHaveAttribute('aria-label', 'Page Header');

    // Sidebar landmark
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('aria-label', 'Main Navigation');

    // Main content landmark
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveAttribute('id', 'main-content');
    expect(mainContent).toHaveAttribute('tabIndex', '-1');
  });

  it('should not have any accessibility violations', async () => {
    const { container } = render(
      <MainLayout>
        <SamplePageContent />
      </MainLayout>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});