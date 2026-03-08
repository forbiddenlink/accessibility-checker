import { z } from 'zod';

/**
 * Hex color validation pattern
 * Accepts: #RGB, #RRGGBB (case insensitive)
 */
const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Schema for a saved color palette
 */
export const savedPaletteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  foreground: z.string().regex(hexColorRegex, 'Invalid hex color format'),
  background: z.string().regex(hexColorRegex, 'Invalid hex color format'),
  contrast: z.number().min(1).max(21), // WCAG contrast ratio range
  timestamp: z.number().int().positive()
});

/**
 * Schema for array of saved palettes
 */
export const savedPalettesSchema = z.array(savedPaletteSchema);

/**
 * TypeScript type inferred from schema
 */
export type SavedPalette = z.infer<typeof savedPaletteSchema>;

/**
 * Safely parse localStorage data for saved palettes
 * Returns empty array for invalid/corrupted data
 */
export function parseSavedPalettes(data: string | null): SavedPalette[] {
  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);
    const result = savedPalettesSchema.safeParse(parsed);

    if (result.success) {
      return result.data;
    }

    // Log validation errors for debugging
    console.warn('Invalid palette data in localStorage:', result.error.issues);
    return [];
  } catch (error) {
    // JSON parse error
    console.warn('Failed to parse palette data from localStorage:', error);
    return [];
  }
}

/**
 * Serialize palettes for localStorage
 * Validates before serializing to catch bugs early
 */
export function stringifySavedPalettes(palettes: SavedPalette[]): string {
  // Validate before saving to catch programming errors
  const result = savedPalettesSchema.safeParse(palettes);
  if (!result.success) {
    console.error('Attempted to save invalid palette data:', result.error.issues);
    throw new Error('Invalid palette data');
  }
  return JSON.stringify(palettes);
}
