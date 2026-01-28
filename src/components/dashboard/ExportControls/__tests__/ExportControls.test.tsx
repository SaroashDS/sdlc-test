import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ExportControls } from './ExportControls';
import type { ExportControlsProps } from './ExportControls';

// Mock the CSS module to prevent errors and allow class name checks
jest.mock('./ExportControls.module.css', () => ({
  exportControls: 'exportControls',
  buttonGroup: 'buttonGroup',
  exportButton: 'exportButton',
  spinner: 'spinner',
  icon: 'icon',
  buttonText: 'buttonText',
}));

describe('ExportControls', () => {
  const mockOnExportCSV = jest.fn();
  const mockOnExportPDF = jest.fn();
  const mockOnExportJSON = jest.fn();

  const defaultProps: ExportControlsProps = {
    onExportCSV: mockOnExportCSV,
    onExportPDF: mockOnExportPDF,
    onExportJSON: mockOnExportJSON,
    isExportingCSV: false,
    isExportingPDF: false,
    isExportingJSON: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (props: Partial<ExportControlsProps> = {}) => {
    const view = render(<ExportControls {...defaultProps} {...props} />);
    return {
      ...view,
      user: userEvent.setup(),
      getButton: (name: 'CSV' | 'PDF' | 'JSON') => screen.getByRole('button', { name }),
    };
  };

  describe('Rendering and Structure', () => {
    it('renders all three export buttons correctly', () => {
      const { getButton } = setup();
      expect(getButton('CSV')).toBeInTheDocument();
      expect(getButton('PDF')).toBeInTheDocument();
      expect(getButton('JSON')).toBeInTheDocument();
    });

    it('renders a section with an accessible name provided by a visually hidden heading', () => {
      setup();
      const section = screen.getByRole('region', { name: /data export controls/i });
      expect(section).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: /data export controls/i, level: 2 });
      expect(heading).toHaveClass('visually-hidden');
      expect(section).toHaveAttribute('aria-labelledby', heading.id);
    });

    it('applies a custom className to the container element', () => {
      const customClass = 'my-custom-class';
      setup({ className: customClass });
      const section = screen.getByRole('region', { name: /data export controls/i });
      expect(section).toHaveClass('exportControls', customClass);
    });

    it('renders download icons for all buttons in the default state', () => {
      const { getButton } = setup();
      const csvButton = getButton('CSV');
      const pdfButton = getButton('PDF');
      const jsonButton = getButton('JSON');

      // The icon itself is aria-hidden, so we query within the button for its class
      expect(within(csvButton).container.querySelector('.icon')).toBeInTheDocument();
      expect(within(pdfButton).container.querySelector('.icon')).toBeInTheDocument();
      expect(within(jsonButton).container.querySelector('.icon')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onExportCSV when the CSV button is clicked', async () => {
      const { user, getButton } = setup();
      await user.click(getButton('CSV'));
      expect(mockOnExportCSV).toHaveBeenCalledTimes(1);
      expect(mockOnExportPDF).not.toHaveBeenCalled();
      expect(mockOnExportJSON).not.toHaveBeenCalled();
    });

    it('calls onExportPDF when the PDF button is clicked', async () => {
      const { user, getButton } = setup();
      await user.click(getButton('PDF'));
      expect(mockOnExportPDF).toHaveBeenCalledTimes(1);
      expect(mockOnExportCSV).not.toHaveBeenCalled();
      expect(mockOnExportJSON).not.toHaveBeenCalled();
    });

    it('calls onExportJSON when the JSON button is clicked', async () => {
      const { user, getButton } = setup();
      await user.click(getButton('JSON'));
      expect(mockOnExportJSON).toHaveBeenCalledTimes(1);
      expect(mockOnExportCSV).not.toHaveBeenCalled();
      expect(mockOnExportPDF).not.toHaveBeenCalled();
    });

    it('does not call export handlers when buttons are disabled', async () => {
      const { user, getButton } = setup({
        isExportingCSV: true,
        isExportingPDF: true,
        isExportingJSON: true,
      });

      // userEvent.click handles disabled checks automatically
      await user.click(getButton('CSV'));
      await user.click(getButton('PDF'));
      await user.click(getButton('JSON'));

      expect(mockOnExportCSV).not.toHaveBeenCalled();
      expect(mockOnExportPDF).not.toHaveBeenCalled();
      expect(mockOnExportJSON).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('disables the CSV button and shows a spinner when isExportingCSV is true', () => {
      const { getButton } = setup({ isExportingCSV: true });
      const csvButton = getButton('CSV');

      expect(csvButton).toBeDisabled();
      expect(csvButton).toHaveAttribute('aria-busy', 'true');
      expect(within(csvButton).container.querySelector('.spinner')).toBeInTheDocument();
      expect(within(csvButton).container.querySelector('.icon')).not.toBeInTheDocument();
    });

    it('disables the PDF button and shows a spinner when isExportingPDF is true', () => {
      const { getButton } = setup({ isExportingPDF: true });
      const pdfButton = getButton('PDF');

      expect(pdfButton).toBeDisabled();
      expect(pdfButton).toHaveAttribute('aria-busy', 'true');
      expect(within(pdfButton).container.querySelector('.spinner')).toBeInTheDocument();
      expect(within(pdfButton).container.querySelector('.icon')).not.toBeInTheDocument();
    });

    it('disables the JSON button and shows a spinner when isExportingJSON is true', () => {
      const { getButton } = setup({ isExportingJSON: true });
      const jsonButton = getButton('JSON');

      expect(jsonButton).toBeDisabled();
      expect(jsonButton).toHaveAttribute('aria-busy', 'true');
      expect(within(jsonButton).container.querySelector('.spinner')).toBeInTheDocument();
      expect(within(jsonButton).container.querySelector('.icon')).not.toBeInTheDocument();
    });

    it('handles mixed loading states correctly', () => {
      const { getButton } = setup({ isExportingPDF: true });
      const csvButton = getButton('CSV');
      const pdfButton = getButton('PDF');
      const jsonButton = getButton('JSON');

      // Enabled state
      expect(csvButton).toBeEnabled();
      expect(csvButton).toHaveAttribute('aria-busy', 'false');
      expect(within(csvButton).container.querySelector('.icon')).toBeInTheDocument();

      // Disabled/Loading state
      expect(pdfButton).toBeDisabled();
      expect(pdfButton).toHaveAttribute('aria-busy', 'true');
      expect(within(pdfButton).container.querySelector('.spinner')).toBeInTheDocument();

      // Enabled state
      expect(jsonButton).toBeEnabled();
      expect(jsonButton).toHaveAttribute('aria-busy', 'false');
      expect(within(jsonButton).container.querySelector('.icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations in the default state', async () => {
      const { container } = setup();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in a loading state', async () => {
      const { container } = setup({ isExportingCSV: true });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('announces loading state to screen readers via aria-live region', () => {
      const { rerender, getButton } = setup({ isExportingCSV: false });
      const csvButton = getButton('CSV');
      
      // In the initial state, the live region is empty
      let liveRegion = within(csvButton).queryByText(/Exporting CSV.../);
      expect(liveRegion).not.toBeInTheDocument();

      // Re-render with loading state
      rerender(<ExportControls {...defaultProps} isExportingCSV={true} />);

      // Now the live region should contain the status message
      liveRegion = within(csvButton).getByText(/Exporting CSV.../);
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveClass('visually-hidden');
    });

    it('removes the loading announcement when exporting is complete', () => {
        const { rerender, getButton } = setup({ isExportingPDF: true });
        const pdfButton = getButton('PDF');
        
        // In the loading state, the live region has text
        expect(within(pdfButton).getByText(/Exporting PDF.../)).toBeInTheDocument();
  
        // Re-render with default state
        rerender(<ExportControls {...defaultProps} isExportingPDF={false} />);
  
        // The live region should now be empty
        expect(within(pdfButton).queryByText(/Exporting PDF.../)).not.toBeInTheDocument();
      });
  });
});