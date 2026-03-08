import { describe, it, expect } from 'vitest';
import { getContrastRatio, getLuminance, hexToRgb, getAPCA, generateColorSuggestions, findClosestAccessibleColor, adjustColorForContrast } from './colorUtils';

describe('colorUtils', () => {
    describe('hexToRgb', () => {
        it('converts valid hex to rgb', () => {
            expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
            expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
            expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
        });

        it('handles short hex', () => {
            expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
            expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
        });

        it('returns null for invalid hex', () => {
            expect(hexToRgb('invalid')).toBeNull();
        });
    });

    describe('getContrastRatio (WCAG 2.1)', () => {
        it('calculates contrast correctly', () => {
            // Black on White = 21:1
            const black = getLuminance(0, 0, 0);
            const white = getLuminance(255, 255, 255);
            expect(getContrastRatio(black, white)).toBeCloseTo(21, 1);

            // Same color = 1:1
            expect(getContrastRatio(white, white)).toBe(1);
        });
    });

    describe('getAPCA', () => {
        it('calculates APCA correctly', () => {
            const black = { r: 0, g: 0, b: 0 };
            const white = { r: 255, g: 255, b: 255 };

            // White text on Black bg -> Negative Lc (approx -106 to -108 depending on implementation specifics)
            // apca-w3 returns string on error, number on success
            const result1 = getAPCA(white, black);
            expect(typeof result1).toBe('number');
            // @ts-ignore
            expect(Math.abs(result1)).toBeGreaterThan(100);

            // Black text on White bg -> Positive Lc (approx 106)
            const result2 = getAPCA(black, white);
            expect(typeof result2).toBe('number');
            // @ts-ignore
            expect(Math.abs(result2)).toBeGreaterThan(100);
        });
    });

    describe('generateColorSuggestions', () => {
        it('generates suggestions for low contrast WCAG', () => {
            const suggestions = generateColorSuggestions('#777777', '#000000', 1.5, 'WCAG');
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0].level).toBeDefined();
        });

        it('generates suggestions for APCA', () => {
            // Dark grey on black, low contrast
            const suggestions = generateColorSuggestions('#333333', '#000000', 10, 'APCA');
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });
    describe('adjustColorForContrast', () => {
        it('never produces negative RGB values when darkening', () => {
            // BUG TEST: Start with color at r=0 where the code tries to darken further
            // Math.min(255, 0-1) = Math.min(255, -1) = -1 which is INVALID
            const almostBlack = { r: 0, g: 0, b: 0 };
            const whiteBg = { r: 255, g: 255, b: 255 };
            // Request impossible contrast (higher than max 21:1) to force repeated darkening
            const targetContrast = 25;

            const result = adjustColorForContrast(almostBlack, whiteBg, targetContrast);

            // RGB values must NEVER go below 0
            expect(result.r).toBeGreaterThanOrEqual(0);
            expect(result.g).toBeGreaterThanOrEqual(0);
            expect(result.b).toBeGreaterThanOrEqual(0);
        });

        it('returns valid RGB values in range 0-255', () => {
            const darkColor = { r: 50, g: 50, b: 50 };
            const whiteBg = { r: 255, g: 255, b: 255 };
            const targetContrast = 10;

            const result = adjustColorForContrast(darkColor, whiteBg, targetContrast);

            expect(result.r).toBeGreaterThanOrEqual(0);
            expect(result.g).toBeGreaterThanOrEqual(0);
            expect(result.b).toBeGreaterThanOrEqual(0);
            expect(result.r).toBeLessThanOrEqual(255);
            expect(result.g).toBeLessThanOrEqual(255);
            expect(result.b).toBeLessThanOrEqual(255);
        });

        it('adjusts color toward target contrast', () => {
            const greyColor = { r: 128, g: 128, b: 128 };
            const whiteBg = { r: 255, g: 255, b: 255 };
            const targetContrast = 4.5;

            const result = adjustColorForContrast(greyColor, whiteBg, targetContrast);

            expect(result.r).toBeGreaterThanOrEqual(0);
            expect(result.r).toBeLessThanOrEqual(255);

            const resultLum = getLuminance(result.r, result.g, result.b);
            const bgLum = getLuminance(255, 255, 255);
            const resultContrast = getContrastRatio(resultLum, bgLum);

            expect(Math.abs(resultContrast - targetContrast)).toBeLessThan(0.2);
        });
    });

    describe('findClosestAccessibleColor', () => {
        it('finds closest WCAG compliant color', () => {
            // #777777 on black is ~4.48:1 (fail AA)
            // Should lighten it slightly
            const result = findClosestAccessibleColor('#777777', '#000000', 4.5, 'WCAG');
            expect(result).not.toBeNull();

            const newRgb = hexToRgb(result!);
            const bgRgb = hexToRgb('#000000');
            const l1 = getLuminance(newRgb!.r, newRgb!.g, newRgb!.b);
            const l2 = getLuminance(bgRgb!.r, bgRgb!.g, bgRgb!.b);
            expect(getContrastRatio(l1, l2)).toBeGreaterThanOrEqual(4.5);
        });

        it('finds closest APCA compliant color', () => {
            // #555555 on black is low Lc
            const result = findClosestAccessibleColor('#555555', '#000000', 75, 'APCA');
            expect(result).not.toBeNull();

            const newRgb = hexToRgb(result!);
            const bgRgb = hexToRgb('#000000');
            const lc = getAPCA(newRgb!, bgRgb!);
            // @ts-ignore
            expect(Math.abs(lc)).toBeGreaterThanOrEqual(75);
        });
    });
});
