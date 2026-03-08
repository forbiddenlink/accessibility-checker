import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorSuggestions from './ColorSuggestions';

describe('ColorSuggestions', () => {
  const defaultProps = {
    foregroundColor: '#333333',
    backgroundColor: '#666666',
    contrastRatio: 2.5,
    suggestions: [
      {
        foreground: '#000000',
        background: '#FFFFFF',
        contrast: 21.0,
        level: 'AAA',
        description: 'Maximum Contrast',
      },
      {
        foreground: '#222222',
        background: '#EEEEEE',
        contrast: 12.5,
        level: 'AAA',
        description: 'High Contrast',
      },
    ],
    onApplySuggestion: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ColorSuggestions {...defaultProps} />);

      expect(screen.getByText(/Suggested alternatives/)).toBeDefined();
    });

    it('displays all suggestions', () => {
      render(<ColorSuggestions {...defaultProps} />);

      expect(screen.getByText('Maximum Contrast')).toBeDefined();
      expect(screen.getByText('High Contrast')).toBeDefined();
    });

    it('displays contrast ratios in WCAG format', () => {
      render(<ColorSuggestions {...defaultProps} />);

      expect(screen.getByText('21.00:1')).toBeDefined();
      expect(screen.getByText('12.50:1')).toBeDefined();
    });

    it('displays Apply buttons for each suggestion', () => {
      render(<ColorSuggestions {...defaultProps} />);

      const applyButtons = screen.getAllByText('Apply');
      expect(applyButtons.length).toBe(2);
    });

    it('displays color codes for each suggestion', () => {
      render(<ColorSuggestions {...defaultProps} />);

      expect(screen.getByText('FG: #000000')).toBeDefined();
      expect(screen.getByText('BG: #FFFFFF')).toBeDefined();
      expect(screen.getByText('FG: #222222')).toBeDefined();
      expect(screen.getByText('BG: #EEEEEE')).toBeDefined();
    });

    it('renders sample text preview with suggested colors', () => {
      render(<ColorSuggestions {...defaultProps} />);

      const sampleTexts = screen.getAllByText('Sample text with improved contrast');
      expect(sampleTexts.length).toBe(2);
    });
  });

  describe('Good Contrast State', () => {
    it('shows success message when WCAG contrast is 4.5 or higher', () => {
      render(
        <ColorSuggestions
          {...defaultProps}
          contrastRatio={4.5}
          mode="WCAG"
        />
      );

      expect(screen.getByText(/meets WCAG AA standards/)).toBeDefined();
    });

    it('shows success message when WCAG contrast is above 4.5', () => {
      render(
        <ColorSuggestions
          {...defaultProps}
          contrastRatio={7.0}
          mode="WCAG"
        />
      );

      expect(screen.getByText(/meets WCAG AA standards/)).toBeDefined();
    });

    it('shows success message when APCA contrast is 75 or higher', () => {
      render(
        <ColorSuggestions
          {...defaultProps}
          contrastRatio={75}
          mode="APCA"
        />
      );

      expect(screen.getByText(/meets APCA standards/)).toBeDefined();
    });

    it('shows success message when APCA contrast is negative but absolute value is 75+', () => {
      render(
        <ColorSuggestions
          {...defaultProps}
          contrastRatio={-85}
          mode="APCA"
        />
      );

      expect(screen.getByText(/meets APCA standards/)).toBeDefined();
    });

    it('includes APCA score in success message', () => {
      render(
        <ColorSuggestions
          {...defaultProps}
          contrastRatio={85}
          mode="APCA"
        />
      );

      expect(screen.getByText(/Lc 85/)).toBeDefined();
    });

    it('shows success message when suggestions array is empty', () => {
      render(
        <ColorSuggestions
          {...defaultProps}
          suggestions={[]}
          contrastRatio={2.5}
        />
      );

      expect(screen.getByText(/meets WCAG AA standards/)).toBeDefined();
    });
  });

  describe('User Interactions', () => {
    it('calls onApplySuggestion with correct colors when Apply is clicked', () => {
      const onApplySuggestion = vi.fn();
      render(
        <ColorSuggestions
          {...defaultProps}
          onApplySuggestion={onApplySuggestion}
        />
      );

      const applyButtons = screen.getAllByText('Apply');
      fireEvent.click(applyButtons[0]);

      expect(onApplySuggestion).toHaveBeenCalledTimes(1);
      expect(onApplySuggestion).toHaveBeenCalledWith('#000000', '#FFFFFF');
    });

    it('calls onApplySuggestion with second suggestion colors', () => {
      const onApplySuggestion = vi.fn();
      render(
        <ColorSuggestions
          {...defaultProps}
          onApplySuggestion={onApplySuggestion}
        />
      );

      const applyButtons = screen.getAllByText('Apply');
      fireEvent.click(applyButtons[1]);

      expect(onApplySuggestion).toHaveBeenCalledWith('#222222', '#EEEEEE');
    });

    it('handles missing onApplySuggestion gracefully', () => {
      render(
        <ColorSuggestions
          {...defaultProps}
          onApplySuggestion={undefined}
        />
      );

      const applyButtons = screen.getAllByText('Apply');
      // Should not throw when clicked
      expect(() => fireEvent.click(applyButtons[0])).not.toThrow();
    });
  });

  describe('APCA Mode Display', () => {
    it('displays APCA format for contrast in suggestions', () => {
      const apcaSuggestions = [
        {
          foreground: '#000000',
          background: '#FFFFFF',
          contrast: 106,
          level: 'AAA',
          description: 'Maximum Contrast',
        },
      ];

      render(
        <ColorSuggestions
          {...defaultProps}
          suggestions={apcaSuggestions}
          mode="APCA"
        />
      );

      expect(screen.getByText('Lc 106')).toBeDefined();
    });

    it('handles negative APCA values in suggestions', () => {
      const apcaSuggestions = [
        {
          foreground: '#FFFFFF',
          background: '#000000',
          contrast: -106,
          level: 'AAA',
          description: 'Inverted Contrast',
        },
      ];

      render(
        <ColorSuggestions
          {...defaultProps}
          suggestions={apcaSuggestions}
          mode="APCA"
        />
      );

      expect(screen.getByText('Lc 106')).toBeDefined();
    });
  });

  describe('Default Props', () => {
    it('defaults to WCAG mode when mode is not specified', () => {
      const propsWithoutMode = {
        foregroundColor: '#333333',
        backgroundColor: '#666666',
        contrastRatio: 5.0,
        suggestions: [],
      };

      render(<ColorSuggestions {...propsWithoutMode} />);

      expect(screen.getByText(/meets WCAG AA standards/)).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles single suggestion', () => {
      render(
        <ColorSuggestions
          {...defaultProps}
          suggestions={[defaultProps.suggestions[0]]}
        />
      );

      const applyButtons = screen.getAllByText('Apply');
      expect(applyButtons.length).toBe(1);
    });

    it('handles many suggestions', () => {
      const manySuggestions = Array.from({ length: 10 }, (_, i) => ({
        foreground: `#${String(i).padStart(6, '0')}`,
        background: '#FFFFFF',
        contrast: 10 + i,
        level: 'AA',
        description: `Suggestion ${i + 1}`,
      }));

      render(
        <ColorSuggestions
          {...defaultProps}
          suggestions={manySuggestions}
        />
      );

      const applyButtons = screen.getAllByText('Apply');
      expect(applyButtons.length).toBe(10);
    });

    it('applies inline styles for color preview', () => {
      render(<ColorSuggestions {...defaultProps} />);

      const sampleTexts = screen.getAllByText('Sample text with improved contrast');
      const previewDiv = sampleTexts[0].parentElement;

      expect(previewDiv?.style.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(previewDiv?.style.color).toBe('rgb(0, 0, 0)');
    });
  });
});
