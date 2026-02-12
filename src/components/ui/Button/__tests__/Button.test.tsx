import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './Button';

// A simple SVG icon component for testing purposes
const TestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg data-testid="test-icon" {...props}>
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>
);

describe('Button', () => {
  describe('Rendering and Props', () => {
    it('renders correctly with default props and children', () => {
      render(<Button>Click Me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('button', 'primary', 'md');
      expect(button).not.toBeDisabled();
    });

    it('renders complex children correctly', () => {
      render(
        <Button>
          <span>Submit</span> Form
        </Button>
      );
      const button = screen.getByRole('button', { name: /submit form/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it.each([
      ['primary', 'primary'],
      ['secondary', 'secondary'],
      ['destructive', 'destructive'],
    ])('applies the correct class for variant="%s"', (variant, expectedClass) => {
      render(<Button variant={variant as 'primary' | 'secondary' | 'destructive'}>Variant Test</Button>);
      expect(screen.getByRole('button')).toHaveClass(expectedClass);
    });

    it.each([
      ['sm', 'sm'],
      ['md', 'md'],
      ['lg', 'lg'],
    ])('applies the correct class for size="%s"', (size, expectedClass) => {
      render(<Button size={size as 'sm' | 'md' | 'lg'}>Size Test</Button>);
      expect(screen.getByRole('button')).toHaveClass(expectedClass);
    });

    it('applies the fullWidth class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('fullWidth');
    });

    it('does not apply the fullWidth class by default', () => {
      render(<Button>Not Full Width</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('fullWidth');
    });

    it('applies a custom className alongside default classes', () => {
      render(<Button className="my-custom-class">Custom Class</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button', 'primary', 'md', 'my-custom-class');
    });

    it('passes through other standard button attributes', () => {
      render(<Button type="submit" aria-label="Submit Form">Submit</Button>);
      const button = screen.getByRole('button', { name: /submit form/i });
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('State and Interaction', () => {
    it('disables the button when the disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('disables the button and shows a loader when isLoading is true', () => {
      render(<Button isLoading>Loading...</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveClass('loading');
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
      // Content should still be present for SEO and context, though visually hidden/overlaid
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('calls the onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick handler when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick handler when loading', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} isLoading>Loading</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('triggers onClick with Enter key when focused', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('triggers onClick with Space key when focused', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icons', () => {
    it('renders a left icon correctly', () => {
      render(<Button leftIcon={<TestIcon />}>Left Icon</Button>);
      const icon = screen.getByTestId('test-icon');
      const button = screen.getByRole('button');
      const contentSpan = button.querySelector('.content');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
      expect(icon).toHaveClass('icon');
      // Check order: icon should be before text
      expect(contentSpan?.firstChild).toBe(icon);
    });

    it('renders a right icon correctly', () => {
      render(<Button rightIcon={<TestIcon />}>Right Icon</Button>);
      const icon = screen.getByTestId('test-icon');
      const button = screen.getByRole('button');
      const contentSpan = button.querySelector('.content');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
      expect(icon).toHaveClass('icon');
      // Check order: icon should be after text
      expect(contentSpan?.lastChild).toBe(icon);
    });

    it('renders both left and right icons', () => {
      const LeftIcon = () => <svg data-testid="left-icon"></svg>;
      const RightIcon = () => <svg data-testid="right-icon"></svg>;
      render(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards a ref to the underlying button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Ref Button');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations in its default state', async () => {
      const { container } = render(<Button>Default Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when loading', async () => {
      const { container } = render(<Button isLoading>Loading Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with icons', async () => {
      const { container } = render(
        <Button leftIcon={<TestIcon />} rightIcon={<TestIcon />}>
          Icon Button
        </Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});