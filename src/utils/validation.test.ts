import { describe, it, expect } from 'vitest';
import { savedPaletteSchema, savedPalettesSchema, parseSavedPalettes } from './validation';

describe('savedPaletteSchema', () => {
  it('accepts valid palette data', () => {
    const validPalette = {
      id: 'palette-123',
      name: 'My Palette',
      foreground: '#000000',
      background: '#FFFFFF',
      contrast: 21,
      timestamp: 1234567890
    };

    const result = savedPaletteSchema.safeParse(validPalette);
    expect(result.success).toBe(true);
  });

  it('rejects palette with invalid hex color', () => {
    const invalidPalette = {
      id: 'palette-123',
      name: 'My Palette',
      foreground: 'not-a-color',
      background: '#FFFFFF',
      contrast: 21,
      timestamp: 1234567890
    };

    const result = savedPaletteSchema.safeParse(invalidPalette);
    expect(result.success).toBe(false);
  });

  it('rejects palette with missing id', () => {
    const invalidPalette = {
      name: 'My Palette',
      foreground: '#000000',
      background: '#FFFFFF',
      contrast: 21,
      timestamp: 1234567890
    };

    const result = savedPaletteSchema.safeParse(invalidPalette);
    expect(result.success).toBe(false);
  });

  it('rejects palette with negative contrast', () => {
    const invalidPalette = {
      id: 'palette-123',
      name: 'My Palette',
      foreground: '#000000',
      background: '#FFFFFF',
      contrast: -5,
      timestamp: 1234567890
    };

    const result = savedPaletteSchema.safeParse(invalidPalette);
    expect(result.success).toBe(false);
  });

  it('accepts 3-character hex colors', () => {
    const validPalette = {
      id: 'palette-123',
      name: 'My Palette',
      foreground: '#000',
      background: '#FFF',
      contrast: 21,
      timestamp: 1234567890
    };

    const result = savedPaletteSchema.safeParse(validPalette);
    expect(result.success).toBe(true);
  });
});

describe('savedPalettesSchema', () => {
  it('accepts empty array', () => {
    const result = savedPalettesSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('accepts array of valid palettes', () => {
    const validPalettes = [
      {
        id: 'palette-1',
        name: 'Palette 1',
        foreground: '#000000',
        background: '#FFFFFF',
        contrast: 21,
        timestamp: 1234567890
      },
      {
        id: 'palette-2',
        name: 'Palette 2',
        foreground: '#333333',
        background: '#EEEEEE',
        contrast: 10.5,
        timestamp: 1234567891
      }
    ];

    const result = savedPalettesSchema.safeParse(validPalettes);
    expect(result.success).toBe(true);
  });

  it('rejects array with invalid palette', () => {
    const mixedPalettes = [
      {
        id: 'palette-1',
        name: 'Valid Palette',
        foreground: '#000000',
        background: '#FFFFFF',
        contrast: 21,
        timestamp: 1234567890
      },
      {
        id: 'palette-2',
        name: 'Invalid Palette',
        foreground: 'bad-color',
        background: '#FFFFFF',
        contrast: 21,
        timestamp: 1234567891
      }
    ];

    const result = savedPalettesSchema.safeParse(mixedPalettes);
    expect(result.success).toBe(false);
  });

  it('rejects non-array values', () => {
    expect(savedPalettesSchema.safeParse('not an array').success).toBe(false);
    expect(savedPalettesSchema.safeParse(null).success).toBe(false);
    expect(savedPalettesSchema.safeParse({ palettes: [] }).success).toBe(false);
  });
});

describe('parseSavedPalettes', () => {
  it('returns empty array for null input', () => {
    expect(parseSavedPalettes(null)).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseSavedPalettes('not valid json')).toEqual([]);
  });

  it('returns empty array for corrupted data', () => {
    const corruptedData = JSON.stringify([
      { id: 1, name: 'bad', fg: 'invalid' }
    ]);
    expect(parseSavedPalettes(corruptedData)).toEqual([]);
  });

  it('parses valid JSON string', () => {
    const validData = JSON.stringify([
      {
        id: 'palette-1',
        name: 'Test',
        foreground: '#000000',
        background: '#FFFFFF',
        contrast: 21,
        timestamp: 1234567890
      }
    ]);

    const result = parseSavedPalettes(validData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('palette-1');
  });

  it('filters out invalid palettes from mixed data', () => {
    // Note: This test documents the expected behavior -
    // the function should either reject all or filter invalid entries
    // Based on strictness preference, we reject all if any invalid
    const mixedData = JSON.stringify([
      {
        id: 'valid-1',
        name: 'Valid',
        foreground: '#000000',
        background: '#FFFFFF',
        contrast: 21,
        timestamp: 1234567890
      },
      {
        id: 'invalid',
        name: 'Bad',
        foreground: 'not-hex',
        background: '#FFFFFF',
        contrast: 21,
        timestamp: 1234567890
      }
    ]);

    // Strict mode: reject all if any invalid
    expect(parseSavedPalettes(mixedData)).toEqual([]);
  });
});
