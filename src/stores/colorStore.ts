import { create } from 'zustand';
import {
  getContrastRatio,
  getAPCA,
  generateColorSuggestions,
  hexToRgb,
  getLuminance
} from '@/utils/colorUtils';

// Types
export type ContrastMode = 'WCAG' | 'APCA';

export interface ContrastResults {
  contrast: number;
  apca: number | null;
  AA: {
    normal: boolean;
    large: boolean;
  };
  AAA: {
    normal: boolean;
    large: boolean;
  };
  suggestions?: Array<{
    foreground: string;
    background: string;
    contrast: number;
    level: string;
    description: string;
  }>;
}

export interface ColorError {
  type: 'INVALID_COLOR' | null;
  message: string;
}

interface ColorState {
  // State
  foregroundColor: string;
  backgroundColor: string;
  mode: ContrastMode;
  results: ContrastResults | null;
  loading: boolean;
  error: ColorError;

  // Actions
  setForegroundColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setMode: (mode: ContrastMode) => void;
  swapColors: () => void;
  checkContrast: () => void;
  resetColors: () => void;
  setColors: (foreground: string, background: string) => void;
}

// Constants
const DEFAULT_FOREGROUND = '#000000';
const DEFAULT_BACKGROUND = '#FFFFFF';

// Utilities
const isValidHexColor = (color: string): boolean => /^#[0-9A-F]{6}$/i.test(color);

const normalizeColor = (color: string): string => {
  let normalized = color;
  if (normalized[0] !== '#') normalized = '#' + normalized;
  if (normalized.length === 4) {
    const r = normalized[1], g = normalized[2], b = normalized[3];
    normalized = `#${r}${r}${g}${g}${b}${b}`;
  }
  return normalized.toUpperCase();
};

export const useColorStore = create<ColorState>((set, get) => ({
  // Initial state
  foregroundColor: DEFAULT_FOREGROUND,
  backgroundColor: DEFAULT_BACKGROUND,
  mode: 'WCAG',
  results: null,
  loading: false,
  error: { type: null, message: '' },

  // Actions
  setForegroundColor: (color: string) => {
    try {
      const normalizedColor = normalizeColor(color);
      if (isValidHexColor(normalizedColor)) {
        set({
          foregroundColor: normalizedColor,
          error: { type: null, message: '' }
        });
        // Auto-check contrast when color changes
        get().checkContrast();
      } else {
        set({
          foregroundColor: color,
          error: { type: 'INVALID_COLOR', message: 'Invalid foreground color format' }
        });
      }
    } catch {
      set({
        foregroundColor: color,
        error: { type: 'INVALID_COLOR', message: 'Invalid foreground color format' }
      });
    }
  },

  setBackgroundColor: (color: string) => {
    try {
      const normalizedColor = normalizeColor(color);
      if (isValidHexColor(normalizedColor)) {
        set({
          backgroundColor: normalizedColor,
          error: { type: null, message: '' }
        });
        // Auto-check contrast when color changes
        get().checkContrast();
      } else {
        set({
          backgroundColor: color,
          error: { type: 'INVALID_COLOR', message: 'Invalid background color format' }
        });
      }
    } catch {
      set({
        backgroundColor: color,
        error: { type: 'INVALID_COLOR', message: 'Invalid background color format' }
      });
    }
  },

  setMode: (mode: ContrastMode) => {
    set({ mode });
    // Recalculate with new mode
    get().checkContrast();
  },

  swapColors: () => {
    const { foregroundColor, backgroundColor } = get();
    set({
      foregroundColor: backgroundColor,
      backgroundColor: foregroundColor
    });
    get().checkContrast();
  },

  setColors: (foreground: string, background: string) => {
    const normalizedFg = normalizeColor(foreground);
    const normalizedBg = normalizeColor(background);

    if (isValidHexColor(normalizedFg) && isValidHexColor(normalizedBg)) {
      set({
        foregroundColor: normalizedFg,
        backgroundColor: normalizedBg,
        error: { type: null, message: '' }
      });
      get().checkContrast();
    }
  },

  checkContrast: () => {
    const { foregroundColor, backgroundColor, mode } = get();

    if (!isValidHexColor(foregroundColor) || !isValidHexColor(backgroundColor)) {
      return;
    }

    set({ loading: true });

    try {
      const fgRgb = hexToRgb(foregroundColor);
      const bgRgb = hexToRgb(backgroundColor);

      if (!fgRgb || !bgRgb) {
        throw new Error('Invalid color conversion');
      }

      // Calculate WCAG contrast
      const fgL = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
      const bgL = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      const contrast = getContrastRatio(fgL, bgL);

      // Calculate APCA
      const apca = getAPCA(fgRgb, bgRgb);

      // Generate suggestions based on current mode
      const suggestions = generateColorSuggestions(
        foregroundColor,
        backgroundColor,
        mode === 'WCAG' ? contrast : (apca ?? 0),
        mode
      );

      set({
        results: {
          contrast,
          apca,
          AA: {
            normal: contrast >= 4.5,
            large: contrast >= 3,
          },
          AAA: {
            normal: contrast >= 7,
            large: contrast >= 4.5,
          },
          suggestions
        },
        error: { type: null, message: '' },
        loading: false
      });
    } catch (err) {
      console.error('Contrast check error:', err);
      set({
        error: { type: 'INVALID_COLOR', message: 'Failed to calculate contrast' },
        loading: false
      });
    }
  },

  resetColors: () => {
    set({
      foregroundColor: DEFAULT_FOREGROUND,
      backgroundColor: DEFAULT_BACKGROUND,
      results: null,
      error: { type: null, message: '' }
    });
  }
}));

// Selectors for derived state
export const selectIsValidColors = (state: ColorState): boolean => {
  return isValidHexColor(state.foregroundColor) && isValidHexColor(state.backgroundColor);
};

export const selectPassesAA = (state: ColorState): boolean => {
  return state.results?.AA.normal ?? false;
};

export const selectPassesAAA = (state: ColorState): boolean => {
  return state.results?.AAA.normal ?? false;
};

export const selectCurrentContrast = (state: ColorState): number | null => {
  if (!state.results) return null;
  return state.mode === 'WCAG' ? state.results.contrast : state.results.apca;
};
