import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ColorResult from './ColorResult';

describe('ColorResult', () => {
  const wcagPassingResults = {
    contrast: 7.5,
    apca: null,
    AA: { normal: true, large: true },
    AAA: { normal: true, large: true },
  };

  const wcagPartialResults = {
    contrast: 5.0,
    apca: null,
    AA: { normal: true, large: true },
    AAA: { normal: false, large: true },
  };

  const wcagFailingResults = {
    contrast: 2.0,
    apca: null,
    AA: { normal: false, large: false },
    AAA: { normal: false, large: false },
  };

  const apcaResults = {
    contrast: 4.5,
    apca: 85,
    AA: { normal: true, large: true },
    AAA: { normal: false, large: true },
  };

  describe('WCAG Mode', () => {
    it('renders without crashing', () => {
      render(<ColorResult mode="WCAG" results={wcagPassingResults} />);

      expect(screen.getByText('Contrast Ratio')).toBeDefined();
    });

    it('displays the contrast ratio correctly', () => {
      render(<ColorResult mode="WCAG" results={wcagPassingResults} />);

      expect(screen.getByText('7.50')).toBeDefined();
    });

    it('displays AA and AAA level headings', () => {
      render(<ColorResult mode="WCAG" results={wcagPassingResults} />);

      expect(screen.getByText('Level AA')).toBeDefined();
      expect(screen.getByText('Level AAA')).toBeDefined();
    });

    it('displays all result items with correct labels', () => {
      render(<ColorResult mode="WCAG" results={wcagPassingResults} />);

      expect(screen.getByText('Normal Text (4.5:1)')).toBeDefined();
      expect(screen.getByText('Large Text (3:1)')).toBeDefined();
      expect(screen.getByText('Normal Text (7:1)')).toBeDefined();
      expect(screen.getByText('Large Text (4.5:1)')).toBeDefined();
    });

    it('shows checkmarks for passing results', () => {
      render(<ColorResult mode="WCAG" results={wcagPassingResults} />);

      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(4);
    });

    it('shows X marks for failing results', () => {
      render(<ColorResult mode="WCAG" results={wcagFailingResults} />);

      const xmarks = screen.getAllByText('✗');
      expect(xmarks.length).toBe(4);
    });

    it('shows mixed results correctly', () => {
      render(<ColorResult mode="WCAG" results={wcagPartialResults} />);

      const checkmarks = screen.getAllByText('✓');
      const xmarks = screen.getAllByText('✗');

      expect(checkmarks.length).toBe(3);
      expect(xmarks.length).toBe(1);
    });

    it('applies green color for high contrast scores (7+)', () => {
      render(<ColorResult mode="WCAG" results={wcagPassingResults} />);

      const scoreElement = screen.getByText('7.50');
      expect(scoreElement.className).toContain('text-green-400');
    });

    it('applies blue color for medium contrast scores (4.5-7)', () => {
      render(<ColorResult mode="WCAG" results={wcagPartialResults} />);

      const scoreElement = screen.getByText('5.00');
      expect(scoreElement.className).toContain('text-blue-400');
    });

    it('applies red color for low contrast scores (<4.5)', () => {
      render(<ColorResult mode="WCAG" results={wcagFailingResults} />);

      const scoreElement = screen.getByText('2.00');
      expect(scoreElement.className).toContain('text-red-400');
    });
  });

  describe('APCA Mode', () => {
    it('renders without crashing', () => {
      render(<ColorResult mode="APCA" results={apcaResults} />);

      expect(screen.getByText('APCA Score')).toBeDefined();
    });

    it('displays APCA score with Lc prefix', () => {
      render(<ColorResult mode="APCA" results={apcaResults} />);

      expect(screen.getByText('Lc 85')).toBeDefined();
    });

    it('shows polarity indicator for positive APCA (Dark on Light)', () => {
      render(<ColorResult mode="APCA" results={apcaResults} />);

      expect(screen.getByText('(Dark on Light)')).toBeDefined();
    });

    it('shows polarity indicator for negative APCA (Light on Dark)', () => {
      const negativeApcaResults = {
        ...apcaResults,
        apca: -85,
      };
      render(<ColorResult mode="APCA" results={negativeApcaResults} />);

      expect(screen.getByText('(Light on Dark)')).toBeDefined();
    });

    it('displays all APCA result items', () => {
      render(<ColorResult mode="APCA" results={apcaResults} />);

      expect(screen.getByText('Body Text (Lc 90+)')).toBeDefined();
      expect(screen.getByText('Body Text (Lc 75+)')).toBeDefined();
      expect(screen.getByText('Large Text (Lc 60+)')).toBeDefined();
      expect(screen.getByText('Components (Lc 45+)')).toBeDefined();
    });

    it('correctly evaluates APCA thresholds', () => {
      render(<ColorResult mode="APCA" results={apcaResults} />);

      // Score of 85 should pass 75+ and 60+ and 45+ but fail 90+
      const checkmarks = screen.getAllByText('✓');
      const xmarks = screen.getAllByText('✗');

      expect(checkmarks.length).toBe(3);
      expect(xmarks.length).toBe(1);
    });

    it('applies green color for high APCA scores (90+)', () => {
      const highApcaResults = { ...apcaResults, apca: 95 };
      render(<ColorResult mode="APCA" results={highApcaResults} />);

      const scoreElement = screen.getByText('Lc 95');
      expect(scoreElement.className).toContain('text-green-400');
    });

    it('applies blue color for good APCA scores (75-89)', () => {
      render(<ColorResult mode="APCA" results={apcaResults} />);

      const scoreElement = screen.getByText('Lc 85');
      expect(scoreElement.className).toContain('text-blue-400');
    });

    it('applies yellow color for fair APCA scores (60-74)', () => {
      const fairApcaResults = { ...apcaResults, apca: 65 };
      render(<ColorResult mode="APCA" results={fairApcaResults} />);

      const scoreElement = screen.getByText('Lc 65');
      expect(scoreElement.className).toContain('text-yellow-400');
    });

    it('applies red color for low APCA scores (<60)', () => {
      const lowApcaResults = { ...apcaResults, apca: 45 };
      render(<ColorResult mode="APCA" results={lowApcaResults} />);

      const scoreElement = screen.getByText('Lc 45');
      expect(scoreElement.className).toContain('text-red-400');
    });

    it('uses absolute value for negative APCA scores', () => {
      const negativeApcaResults = { ...apcaResults, apca: -85 };
      render(<ColorResult mode="APCA" results={negativeApcaResults} />);

      // Should display positive value
      expect(screen.getByText('Lc 85')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles APCA mode with null APCA value (falls back to WCAG display)', () => {
      render(<ColorResult mode="APCA" results={wcagPassingResults} />);

      // Should fall back to WCAG display
      expect(screen.getByText('Contrast Ratio')).toBeDefined();
      expect(screen.getByText('7.50')).toBeDefined();
    });

    it('handles zero contrast correctly', () => {
      const zeroResults = {
        contrast: 1.0,
        apca: null,
        AA: { normal: false, large: false },
        AAA: { normal: false, large: false },
      };
      render(<ColorResult mode="WCAG" results={zeroResults} />);

      expect(screen.getByText('1.00')).toBeDefined();
    });
  });
});
