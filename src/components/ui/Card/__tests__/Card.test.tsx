import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Card, type CardProps } from './Card';
import styles from './Card.module.css';

// Mock the CSS module to return class names as strings
jest.mock('./Card.module.css', () => ({
  card: 'card',
  header: 'header',
  title: 'title',
  actions: 'actions',
  content: 'content',
}));

const defaultProps: CardProps = {
  children: <p>Card Content</p>,
};

const renderCard = (props: Partial<CardProps> = {}) => {
  return render(<Card {...defaultProps} {...props} />);
};

describe('Card', () => {
  it('renders the children correctly', () => {
    renderCard();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders without a header when no title or actions are provided', () => {
    renderCard();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument(); // <header> has an implicit role of 'banner'
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('applies the default and custom class names', () => {
    const customClass = 'my-custom-card';
    renderCard({ className: customClass });
    const cardElement = screen.getByRole('region'); // <section> has an implicit role of 'region'
    expect(cardElement).toHaveClass(styles.card, customClass);
  });

  it('forwards additional HTML attributes to the root section element', () => {
    const testId = 'test-card';
    renderCard({ 'data-testid': testId, id: 'custom-id' });
    const cardElement = screen.getByTestId(testId);
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveAttribute('id', 'custom-id');
  });

  describe('with title prop', () => {
    const titleText = 'My Card Title';

    it('renders the header with the title', () => {
      renderCard({ title: titleText });
      const heading = screen.getByRole('heading', { name: titleText, level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass(styles.title);
    });

    it('renders the header element when only a title is provided', () => {
      renderCard({ title: titleText });
      // <header> is a landmark, but only in certain contexts. Querying by its class is more reliable here.
      const cardElement = screen.getByRole('region');
      expect(cardElement.querySelector(`.${styles.header}`)).toBeInTheDocument();
    });
  });

  describe('with actions prop', () => {
    const actionsContent = <button>Click Me</button>;

    it('renders the header with the actions', () => {
      renderCard({ actions: actionsContent });
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('renders the actions inside the correct container', () => {
      renderCard({ actions: actionsContent });
      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button.parentElement).toHaveClass(styles.actions);
    });

    it('renders the header element when only actions are provided', () => {
      renderCard({ actions: actionsContent });
      const cardElement = screen.getByRole('region');
      expect(cardElement.querySelector(`.${styles.header}`)).toBeInTheDocument();
    });
  });

  describe('with both title and actions', () => {
    const titleText = 'Analytics';
    const actionsContent = (
      <div>
        <button>Export</button>
        <button>Refresh</button>
      </div>
    );

    it('renders both the title and actions in the header', () => {
      renderCard({ title: titleText, actions: actionsContent });
      expect(screen.getByRole('heading', { name: titleText, level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('allows interaction with elements passed as actions', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      const actionsContent = <button onClick={handleClick}>Submit</button>;

      renderCard({ actions: actionsContent });

      const button = screen.getByRole('button', { name: 'Submit' });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('associates the card section with its title via aria-labelledby', () => {
      const titleText = 'Accessible Title';
      renderCard({ title: titleText });

      const cardElement = screen.getByRole('region');
      const headingElement = screen.getByRole('heading', { name: titleText });

      expect(headingElement).toHaveAttribute('id');
      const headingId = headingElement.getAttribute('id');
      expect(cardElement).toHaveAttribute('aria-labelledby', headingId);
    });

    it('does not have aria-labelledby when there is no title', () => {
      renderCard({ actions: <button>Action</button> });
      const cardElement = screen.getByRole('region');
      expect(cardElement).not.toHaveAttribute('aria-labelledby');
    });

    it('should have no accessibility violations with only children', async () => {
      const { container } = renderCard();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with a title', async () => {
      const { container } = renderCard({ title: 'Card Title' });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with actions', async () => {
      const { container } = renderCard({ actions: <button>Action</button> });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with title and actions', async () => {
      const { container } = renderCard({
        title: 'Card Title',
        actions: <button>Action</button>,
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});