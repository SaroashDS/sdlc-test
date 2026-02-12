import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MetricCard, MetricCardProps } from './MetricCard';

// Mock the CSS module to return class names as-is
jest.mock('./MetricCard.module.css', () => ({
  card: 'card',
  header: 'header',
  titleIconWrapper: 'titleIconWrapper',
  title: 'title',
  value: 'value',
  trend: 'trend',
  trendIcon: 'trendIcon',
  trendUp: 'trendUp',
  trendDown: 'trendDown',
  trendNeutral: 'trendNeutral',
}));

// A simple SVG icon for testing purposes
const TestIcon = () => (
  <svg data-testid="test-icon" width="24" height="24">
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>
);

describe('MetricCard', () => {
  const defaultProps: MetricCardProps = {
    title: 'Total Revenue',
    value: '$45,231.89',
    trend: {
      direction: 'up',
      value: '+5.2%',
    },
  };

  const renderComponent = (props: Partial<MetricCardProps> = {}) => {
    return render(<MetricCard {...defaultProps} {...props} />);
  };

  it('should render the title, value, and trend value correctly', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: 'Total Revenue' })).toBeInTheDocument();
    expect(screen.getByText('$45,231.89')).toBeInTheDocument();
    expect(screen.getByText('+5.2%')).toBeInTheDocument();
  });

  it('should not render an icon if the icon prop is not provided', () => {
    renderComponent();
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
  });

  it('should render the provided icon next to the title', () => {
    renderComponent({ icon: <TestIcon /> });
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should apply a custom className to the root element', () => {
    const { container } = renderComponent({ className: 'custom-class' });
    // The first child of the container is the <article> element
    expect(container.firstChild).toHaveClass('card custom-class');
  });

  describe('Trend Directions', () => {
    it('should display an upward trend correctly', () => {
      renderComponent({
        trend: { direction: 'up', value: '+10%' },
      });

      const trendContainer = screen.getByLabelText('Trend: up by +10%');
      expect(trendContainer).toBeInTheDocument();
      expect(trendContainer).toHaveClass('trend', 'trendUp');
      expect(trendContainer).not.toHaveClass('trendDown');
      expect(trendContainer).not.toHaveClass('trendNeutral');

      // Check for the up arrow icon's path data
      const upIcon = trendContainer.querySelector('svg');
      expect(upIcon).toBeInTheDocument();
      expect(upIcon?.querySelector('path')?.getAttribute('d')).toContain('M10 17a');
    });

    it('should display a downward trend correctly', () => {
      renderComponent({
        trend: { direction: 'down', value: '-2.1%' },
      });

      const trendContainer = screen.getByLabelText('Trend: down by -2.1%');
      expect(trendContainer).toBeInTheDocument();
      expect(trendContainer).toHaveClass('trend', 'trendDown');
      expect(trendContainer).not.toHaveClass('trendUp');
      expect(trendContainer).not.toHaveClass('trendNeutral');

      // Check for the down arrow icon's path data
      const downIcon = trendContainer.querySelector('svg');
      expect(downIcon).toBeInTheDocument();
      expect(downIcon?.querySelector('path')?.getAttribute('d')).toContain('M10 3a');
    });

    it('should display a neutral trend correctly', () => {
      renderComponent({
        trend: { direction: 'neutral', value: '0.0%' },
      });

      const trendContainer = screen.getByLabelText('Trend: neutral by 0.0%');
      expect(trendContainer).toBeInTheDocument();
      expect(trendContainer).toHaveClass('trend', 'trendNeutral');
      expect(trendContainer).not.toHaveClass('trendUp');
      expect(trendContainer).not.toHaveClass('trendDown');

      // Check for the neutral icon's path data
      const neutralIcon = trendContainer.querySelector('svg');
      expect(neutralIcon).toBeInTheDocument();
      expect(neutralIcon?.querySelector('path')?.getAttribute('d')).toContain('M4 10a');
    });
  });

  describe('Accessibility', () => {
    it('should have the correct ARIA attributes for semantics', () => {
      renderComponent();

      const region = screen.getByRole('region', { name: 'Total Revenue' });
      expect(region).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: 'Total Revenue' });
      const headingId = heading.getAttribute('id');

      expect(headingId).not.toBeNull();
      expect(region).toHaveAttribute('aria-labelledby', headingId);
    });

    it('should have a descriptive aria-label for the trend section', () => {
      renderComponent({
        trend: { direction: 'down', value: '-$300' },
      });
      expect(screen.getByLabelText('Trend: down by -$300')).toBeInTheDocument();
    });

    it('should hide trend icons from screen readers', () => {
      const { container } = renderComponent();
      const trendIcon = container.querySelector('.trendIcon');
      expect(trendIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have no accessibility violations with default props', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with an icon', async () => {
      const { container } = renderComponent({ icon: <TestIcon /> });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with a down trend', async () => {
      const { container } = renderComponent({
        trend: { direction: 'down', value: '-5' },
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with a neutral trend', async () => {
      const { container } = renderComponent({
        trend: { direction: 'neutral', value: '0' },
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});