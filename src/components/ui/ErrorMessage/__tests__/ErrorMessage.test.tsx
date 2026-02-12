import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ErrorMessage, ErrorMessageProps } from './ErrorMessage';

// Mock styles to prevent errors in the test environment
jest.mock('./ErrorMessage.module.css', () => ({
  container: 'container',
  iconContainer: 'iconContainer',
  contentContainer: 'contentContainer',
  title: 'title',
  message: 'message',
  retryButton: 'retryButton',
}));

describe('ErrorMessage', () => {
  const defaultProps: ErrorMessageProps = {
    title: 'Request Failed',
    message: 'There was an issue processing your request. Please try again later.',
  };

  it('should render the title and message correctly', () => {
    render(<ErrorMessage {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: 'Request Failed' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'There was an issue processing your request. Please try again later.'
      )
    ).toBeInTheDocument();
  });

  it('should render the default icon when no custom icon is provided', () => {
    const { container } = render(<ErrorMessage {...defaultProps} />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    // Check for a unique part of the default SVG's path to be more specific
    expect(svgElement?.querySelector('path')).toHaveAttribute(
      'd',
      expect.stringContaining('M9.401 3.003c1.155-2')
    );
  });

  it('should render a custom icon when provided', () => {
    const customIcon = <div data-testid="custom-icon">Custom Icon</div>;
    const { container } = render(
      <ErrorMessage {...defaultProps} icon={customIcon} />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByText('Custom Icon')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should not render the "Try Again" button if onRetry is not provided', () => {
    render(<ErrorMessage {...defaultProps} />);
    expect(
      screen.queryByRole('button', { name: 'Try Again' })
    ).not.toBeInTheDocument();
  });

  it('should render the "Try Again" button if onRetry is provided', () => {
    const handleRetry = jest.fn();
    render(<ErrorMessage {...defaultProps} onRetry={handleRetry} />);
    expect(
      screen.getByRole('button', { name: 'Try Again' })
    ).toBeInTheDocument();
  });

  it('should call the onRetry callback when the "Try Again" button is clicked', async () => {
    const user = userEvent.setup();
    const handleRetry = jest.fn();
    render(<ErrorMessage {...defaultProps} onRetry={handleRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    await user.click(retryButton);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('should apply a custom className to the root element', () => {
    const customClassName = 'my-custom-error';
    const { container } = render(
      <ErrorMessage {...defaultProps} className={customClassName} />
    );

    // RTL's `container` is a div wrapper, so we check its first child.
    const rootElement = container.firstChild;
    expect(rootElement).toHaveClass('container'); // from mock styles
    expect(rootElement).toHaveClass(customClassName);
  });

  it('should render ReactNode as a message', () => {
    const jsxMessage = (
      <>
        Something went wrong. Please check your{' '}
        <a href="/status">system status</a>.
      </>
    );
    render(<ErrorMessage {...defaultProps} message={jsxMessage} />);

    expect(
      screen.getByText(/Something went wrong. Please check your/i)
    ).toBeInTheDocument();
    const linkElement = screen.getByRole('link', { name: 'system status' });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/status');
  });

  describe('Accessibility', () => {
    it('should have the correct ARIA attributes for an alert', () => {
      render(<ErrorMessage {...defaultProps} />);
      const alertContainer = screen.getByRole('alert');

      expect(alertContainer).toBeInTheDocument();
      expect(alertContainer).toHaveAttribute('aria-live', 'assertive');

      // Check that the alert is properly labelled and described
      const title = screen.getByRole('heading', { name: defaultProps.title });
      const message = screen.getByText(defaultProps.message as string);

      expect(alertContainer).toHaveAttribute('aria-labelledby', title.id);
      expect(alertContainer).toHaveAttribute('aria-describedby', message.id);
      expect(title.id).toBeTruthy();
      expect(message.id).toBeTruthy();
    });

    it('should not have any automatically detectable accessibility violations', async () => {
      const { container } = render(
        <ErrorMessage {...defaultProps} onRetry={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});