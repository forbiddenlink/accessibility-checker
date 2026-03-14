import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock the ColorContrastChecker component
vi.mock('@/components/ColorContrastChecker', () => ({
    default: () => (
        <div data-testid="color-contrast-checker">
            <button>Execute Check</button>
        </div>
    ),
}));

// Mock the HeroSection component
vi.mock('@/components/HeroSection', () => ({
    default: () => (
        <section>
            <h1>Precision Contrast Control.</h1>
            <p>Advanced color accessibility tools for designers and developers.</p>
        </section>
    ),
}));

describe('Home Page', () => {
    it('renders the main heading from HeroSection', () => {
        render(<Home />);

        // Check for the main heading
        const heading = screen.getByText(/Precision Contrast/i);
        expect(heading).toBeDefined();
    });

    it('renders the ColorContrastChecker component', () => {
        render(<Home />);

        // Check for the Execute Check button from ColorContrastChecker
        const button = screen.getByText('Execute Check');
        expect(button).toBeDefined();
    });

    it('renders the color contrast checker section', () => {
        render(<Home />);

        const checker = screen.getByTestId('color-contrast-checker');
        expect(checker).toBeDefined();
    });
});
