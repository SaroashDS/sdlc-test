import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Mail } from 'lucide-react'; // We'll use a real icon for mocking purposes
import type { LucideProps } from 'lucide-react';

import { Icon, type IconSize, type IconColor } from './Icon';

// Mock the lucide-react icon component.
// This allows us to inspect the props passed to it without rendering a complex SVG.
jest.mock('lucide-react', () => {
  // Create a generic mock icon component
  const MockLucideIcon = React.forwardRef<SVGSVGElement, LucideProps>(
    (props, ref) => (
      <svg ref={ref} data-testid="mock-icon" {...props}>
        <title>Mock Icon</title>
      </svg>
    ),
  );
  MockLucideIcon.displayName = 'MockLucideIcon';

  // Return all exports from the original module, but override the icons
  // with our generic mock. This ensures that type imports still work.
  return {
    ...jest.requireActual('lucide-react'),
    Mail: MockLucideIcon,
    // Add any other icons used in tests here
  };
});

// Mock the CSS module to allow class name checks.
// The proxy ensures that any class access (e.g., styles.icon) returns the class name as a string.
jest.mock('./Icon.module.css', () => new Proxy({}, {
  get: (target, prop) => {
    if (typeof prop === 'string') {
      return prop;
    }
    return undefined;
  },
}));

describe('Icon Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the provided icon component', () => {
    render(<Icon icon={Mail} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('should apply default size "md" and color "default" classes when no props are provided', () => {
    render(<Icon icon={Mail} />);
    const iconElement = screen.getByTestId('mock-icon');
    expect(iconElement).toHaveClass('icon', 'md', 'default');
  });

  it('should not include undefined or null classNames', () => {
    render(<Icon icon={Mail} className={undefined} />);
    const iconElement = screen.getByTestId('mock-icon');
    // The class string should not have extra spaces from undefined values
    expect(iconElement.getAttribute('class')).toBe('icon md default');
  });

  describe('Size Prop', () => {
    const sizes: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    it.each(sizes)('should apply the correct class for size "%s"', (size) => {
      render(<Icon icon={Mail} size={size} />);
      const iconElement = screen.getByTestId('mock-icon');
      expect(iconElement).toHaveClass(size);
      // Ensure default classes are still present
      expect(iconElement).toHaveClass('icon', 'default');
    });
  });

  describe('Color Prop', () => {
    const colors: IconColor[] = [
      'default',
      'primary',
      'secondary',
      'muted',
      'success',
      'warning',
      'danger',
    ];

    it.each(colors)('should apply the correct class for color "%s"', (color) => {
      render(<Icon icon={Mail} color={color} />);
      const iconElement = screen.getByTestId('mock-icon');
      expect(iconElement).toHaveClass(color);
      // Ensure default classes are still present
      expect(iconElement).toHaveClass('icon', 'md');
    });
  });

  it('should apply a custom className alongside other classes', () => {
    const customClass = 'my-custom-icon-class';
    render(<Icon icon={Mail} className={customClass} />);
    const iconElement = screen.getByTestId('mock-icon');
    expect(iconElement).toHaveClass('icon', 'md', 'default', customClass);
  });

  it('should correctly combine size, color, and custom className props', () => {
    const customClass = 'another-class';
    render(<Icon icon={Mail} size="lg" color="primary" className={customClass} />);
    const iconElement = screen.getByTestId('mock-icon');
    expect(iconElement).toHaveClass('icon', 'lg', 'primary', customClass);
    expect(iconElement).not.toHaveClass('md');
    expect(iconElement).not.toHaveClass('default');
  });

  it('should forward additional props to the underlying icon component', () => {
    render(<Icon icon={Mail} strokeWidth={1.5} data-foo="bar" id="my-icon" />);
    const iconElement = screen.getByTestId('mock-icon');
    expect(iconElement).toHaveAttribute('strokeWidth', '1.5');
    expect(iconElement).toHaveAttribute('data-foo', 'bar');
    expect(iconElement).toHaveAttribute('id', 'my-icon');
  });

  it('should handle user interactions like onClick', () => {
    const handleClick = jest.fn();
    render(<Icon icon={Mail} onClick={handleClick} />);
    const iconElement = screen.getByTestId('mock-icon');
    fireEvent.click(iconElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  describe('Accessibility', () => {
    it('should be decorative by default and have aria-hidden="true"', () => {
      render(<Icon icon={Mail} />);
      const iconElement = screen.getByTestId('mock-icon');
      expect(iconElement).toHaveAttribute('aria-hidden', 'true');
      // A decorative icon should not have an accessible role like 'img'
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should be accessible when an aria-label is provided', () => {
      const label = 'Send Email';
      render(<Icon icon={Mail} aria-label={label} />);
      const iconElement = screen.getByRole('img', { name: label });
      expect(iconElement).toBeInTheDocument();
      expect(iconElement).not.toHaveAttribute('aria-hidden');
    });

    it('should be accessible when aria-labelledby is provided', () => {
      const labelId = 'icon-label';
      render(
        <div>
          <span id={labelId}>Close Window</span>
          <Icon icon={Mail} aria-labelledby={labelId} />
        </div>,
      );
      const iconElement = screen.getByRole('img', { name: 'Close Window' });
      expect(iconElement).toBeInTheDocument();
      expect(iconElement).not.toHaveAttribute('aria-hidden');
    });

    it('should remain decorative if only a title prop is passed without an accessible name', () => {
      // Note: `title` inside SVG is not sufficient for accessibility on its own for all screen readers.
      // The component correctly prioritizes `aria-label` and `aria-labelledby`.
      render(<Icon icon={Mail} title="An icon" />);
      const iconElement = screen.getByTestId('mock-icon');
      expect(iconElement).toHaveAttribute('aria-hidden', 'true');
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });
});