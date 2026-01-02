import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock the hooks and components that might cause issues in testing
vi.mock('@/hooks/useColorContrast', () => ({
    default: () => ({
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
        setForegroundColor: vi.fn(),
        setBackgroundColor: vi.fn(),
        results: null,
        loading: { colorCheck: false },
        error: { type: null, message: '' },
        checkContrast: vi.fn(),
        mode: 'WCAG',
        setMode: vi.fn(),
    }),
}));

// Mock dynamic components
vi.mock('next/dynamic', () => ({
    default: () => {
        const MockComponent = () => <div>Mock Dynamic Component</div>;
        return MockComponent;
    },
}));

describe('Home Page', () => {
    it('renders the main heading', () => {
        render(<Home />);

        // Check for the main heading
        const heading = screen.getByText('Color Contrast Checker');
        expect(heading).toBeDefined();

        // Check for the Analyze button
        const button = screen.getByText('Check Contrast');
        expect(button).toBeDefined();
    });
});
