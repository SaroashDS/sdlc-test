import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { KpiCard, KpiCardProps } from './KpiCard';

// Mock CSS modules
jest.mock('./KpiCard.module.css', () => ({
  card: 'card',
  header: 'header',
  titleWrapper: 'titleWrapper',
  iconWrapper: 'iconWrapper',
  title: 'title',
  infoTooltipWrapper: 'infoTooltipWrapper',
  infoTooltipText: 'infoTooltipText',
  mainContent: 'mainContent',
  value: 'value',
  changeIndicator: 'changeIndicator',
  changeValue: 'changeValue',
  positive: 'positive',
  negative: 'negative',
  neutral: 'neutral',
}));

const defaultProps: KpiCardProps = {
  title: 'Total Revenue',
  value: '$1.2M',
  change: '+12.2%',
  changeType: 'positive',
};

const TestIcon = () => <svg data-testid="test-icon" />;

describe('KpiCard', () => {
  it('renders all core elements with required props', () => {
    render(<KpiCard {...defaultProps} />);

    // Check for title, value, and change text
    expect(screen.getByRole('heading', { name: 'Total Revenue' })).toBeInTheDocument();
    expect(screen.getByText('$1.2M')).toBeInTheDocument();
    expect(screen.getByText('+12.2%')).toBeInTheDocument();

    // Check that optional elements are not present
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Information about Total Revenue')).not.toBeInTheDocument();
  });

  describe('Prop Variations', () => {
    it('renders a positive change correctly', () => {
      render(<KpiCard {...defaultProps} changeType="positive" />);
      const changeIndicator = screen.getByText('+12.2%').parentElement;
      expect(changeIndicator).toHaveClass('changeIndicator positive');
      // The SVG for positive change has a path for an up arrow
      expect(changeIndicator?.querySelector('path[d="M18 11l-6 -6l-6 6"]')).toBeInTheDocument();
    });

    it('renders a negative change correctly', () => {
      render(<KpiCard {...defaultProps} change="-5.1%" changeType="negative" />);
      const changeIndicator = screen.getByText('-5.1%').parentElement;
      expect(changeIndicator).toHaveClass('changeIndicator negative');
      // The SVG for negative change has a path for a down arrow
      expect(changeIndicator?.querySelector('path[d="M18 13l-6 6l-6 -6"]')).toBeInTheDocument();
    });

    it('renders a neutral change correctly', () => {
      render(<KpiCard {...defaultProps} change="0.0%" changeType="neutral" />);
      const changeIndicator = screen.getByText('0.0%').parentElement;
      expect(changeIndicator).toHaveClass('changeIndicator neutral');
      // The SVG for neutral change has a path for a horizontal line
      expect(changeIndicator?.querySelector('path[d="M5 12l14 0"]')).toBeInTheDocument();
    });

    it('renders an icon when the icon prop is provided', () => {
      render(<KpiCard {...defaultProps} icon={<TestIcon />} />);
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      // Check that the wrapper is hidden from screen readers
      expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('does not render an icon when the icon prop is omitted', () => {
      render(<KpiCard {...defaultProps} />);
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('renders an info tooltip when the info prop is provided', () => {
      const infoText = 'This is the total revenue for the last quarter.';
      render(<KpiCard {...defaultProps} info={infoText} />);

      const tooltipTrigger = screen.getByLabelText('Information about Total Revenue');
      expect(tooltipTrigger).toBeInTheDocument();
      expect(tooltipTrigger).toHaveAttribute('tabindex', '0');

      const tooltip = screen.getByRole('tooltip', { hidden: true });
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(infoText);
      // Note: Visibility is controlled by CSS (:hover, :focus), so we check for presence.
    });

    it('does not render an info tooltip when the info prop is omitted', () => {
      render(<KpiCard {...defaultProps} />);
      expect(screen.queryByLabelText(/Information about/)).not.toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('applies a custom className to the root element', () => {
      const customClass = 'my-custom-kpi-card';
      const { container } = render(<KpiCard {...defaultProps} className={customClass} />);
      expect(container.firstChild).toHaveClass('card', customClass);
    });
  });

  describe('Accessibility (a11y)', () => {
    it('constructs a comprehensive aria-label for the card (positive change)', () => {
      render(<KpiCard {...defaultProps} />);
      const expectedLabel = 'KPI for Total Revenue: Current value is $1.2M. Increase of 12.2%.';
      expect(screen.getByRole('article')).toHaveAttribute('aria-label', expectedLabel);
    });

    it('constructs a comprehensive aria-label for the card (negative change)', () => {
      render(<KpiCard {...defaultProps} change="-5.1%" changeType="negative" />);
      const expectedLabel = 'KPI for Total Revenue: Current value is $1.2M. Decrease of 5.1%.';
      expect(screen.getByRole('article')).toHaveAttribute('aria-label', expectedLabel);
    });

    it('constructs a comprehensive aria-label for the card (neutral change)', () => {
      render(<KpiCard {...defaultProps} change="0.0%" changeType="neutral" />);
      const expectedLabel = 'KPI for Total Revenue: Current value is $1.2M. No change of 0.0%.';
      expect(screen.getByRole('article')).toHaveAttribute('aria-label', expectedLabel);
    });

    it('provides a specific aria-label for the change indicator', () => {
      render(<KpiCard {...defaultProps} />);
      const changeIndicator = screen.getByText('+12.2%').parentElement;
      expect(changeIndicator).toHaveAttribute('aria-label', 'Increase of 12.2%');
    });

    it('has no accessibility violations with minimal props', async () => {
      const { container } = render(<KpiCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all props', async () => {
      const { container } = render(
        <KpiCard
          {...defaultProps}
          icon={<TestIcon />}
          info="Detailed information about the KPI."
          className="custom-class"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});