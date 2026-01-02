interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

// WCAG relative luminance coefficients
// See: https://www.w3.org/TR/WCAG20/#relativeluminancedef
const LUMINANCE_COEFFICIENTS = {
  RED: 0.2126,
  GREEN: 0.7152,
  BLUE: 0.0722
} as const;

// APCA Import
import { calcAPCA } from 'apca-w3';


// Color space constants
const COLOR_CONSTANTS = {
  MAX_RGB_VALUE: 255,
  GAMMA_THRESHOLD: 0.03928,
  GAMMA_OFFSET: 0.055,
  GAMMA_DIVIDER: 1.055,
  GAMMA_EXPONENT: 2.4,
  GAMMA_SIMPLE_MULTIPLIER: 12.92
} as const;

// Contrast ratio constants
const CONTRAST_CONSTANTS = {
  LUMINANCE_OFFSET: 0.05,
  CONTRAST_TOLERANCE: 0.1,
  MAX_ADJUSTMENT_STEPS: 100
} as const;

export function hexToRgb(hex: string): RGB | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(value => {
    value /= COLOR_CONSTANTS.MAX_RGB_VALUE;
    return value <= COLOR_CONSTANTS.GAMMA_THRESHOLD
      ? value / COLOR_CONSTANTS.GAMMA_SIMPLE_MULTIPLIER
      : Math.pow(
        (value + COLOR_CONSTANTS.GAMMA_OFFSET) / COLOR_CONSTANTS.GAMMA_DIVIDER,
        COLOR_CONSTANTS.GAMMA_EXPONENT
      );
  });
  return rs * LUMINANCE_COEFFICIENTS.RED +
    gs * LUMINANCE_COEFFICIENTS.GREEN +
    bs * LUMINANCE_COEFFICIENTS.BLUE;
}

export function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + CONTRAST_CONSTANTS.LUMINANCE_OFFSET) /
    (darker + CONTRAST_CONSTANTS.LUMINANCE_OFFSET);
}

export function adjustColorForContrast(
  color: RGB,
  bgColor: RGB,
  targetContrast: number
): RGB {
  let { r, g, b } = color;
  const bgLuminance = getLuminance(bgColor.r, bgColor.g, bgColor.b);
  let steps = 0;

  while (steps < CONTRAST_CONSTANTS.MAX_ADJUSTMENT_STEPS) {
    const currentLuminance = getLuminance(r, g, b);
    const currentContrast = getContrastRatio(currentLuminance, bgLuminance);

    if (Math.abs(currentContrast - targetContrast) < CONTRAST_CONSTANTS.CONTRAST_TOLERANCE) {
      break;
    }

    if (currentContrast < targetContrast) {
      // Make color lighter or darker based on background
      if (currentLuminance < bgLuminance) {
        r = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, r - 1);
        g = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, g - 1);
        b = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, b - 1);
      } else {
        r = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, r + 1);
        g = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, g + 1);
        b = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, b + 1);
      }
    } else {
      // Make color closer to background
      if (currentLuminance < bgLuminance) {
        r = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, r + 1);
        g = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, g + 1);
        b = Math.min(COLOR_CONSTANTS.MAX_RGB_VALUE, b + 1);
      } else {
        r = Math.max(0, r - 1);
        g = Math.max(0, g - 1);
        b = Math.max(0, b - 1);
      }
    }

    steps++;
  }

  return { r, g, b };
}

export function getAPCA(foreground: RGB, background: RGB): number | null {
  try {
    const fgInt = (foreground.r << 16) | (foreground.g << 8) | foreground.b;
    const bgInt = (background.r << 16) | (background.g << 8) | background.b;
    return calcAPCA(fgInt, bgInt) as number;
  } catch (e) {
    console.error("APCA Calculation Error:", e);
    return null;
  }
}

export function generateColorSuggestions(foreground: string, background: string, contrast: number, mode: 'WCAG' | 'APCA' = 'WCAG') {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) return [];

  const suggestions = [];

  if (mode === 'WCAG') {
    // If contrast is below AA level (4.5:1), offer suggestions
    if (contrast < 4.5) {
      // 1. Adjust foreground to meet AA (4.5:1)
      const aaColor = findClosestAccessibleColor(foreground, background, 4.5, 'WCAG');
      if (aaColor) {
        suggestions.push({
          foreground: aaColor,
          background: background,
          contrast: 4.5,
          level: "AA",
          description: "Smart adjustment for AA compliance"
        });
      }

      // 2. Adjust foreground to meet AAA (7:1)
      const aaaColor = findClosestAccessibleColor(foreground, background, 7.0, 'WCAG');
      if (aaaColor) {
        suggestions.push({
          foreground: aaaColor,
          background: background,
          contrast: 7,
          level: "AAA",
          description: "Smart adjustment for AAA compliance"
        });
      }
    }
  } else {
    // APCA Suggestions
    // Target Lc 75 (Body Text) and Lc 90 (Preferred)
    const currentLc = Math.abs(contrast);

    if (currentLc < 75) {
      const lc75Color = findClosestAccessibleColor(foreground, background, 75, 'APCA');
      if (lc75Color) {
        // Recalculate exact Lc for display
        const newFg = hexToRgb(lc75Color);
        const newLc = getAPCA(newFg!, bgRgb);
        suggestions.push({
          foreground: lc75Color,
          background: background,
          contrast: newLc || 75,
          level: "AA", // Mapping to roughly AA equivalent
          description: "Smart adjustment for Body Text (Lc 75)"
        });
      }

      const lc90Color = findClosestAccessibleColor(foreground, background, 90, 'APCA');
      if (lc90Color) {
        const newFg = hexToRgb(lc90Color);
        const newLc = getAPCA(newFg!, bgRgb);
        suggestions.push({
          foreground: lc90Color,
          background: background,
          contrast: newLc || 90,
          level: "AAA", // Mapping to roughly AAA equivalent
          description: "Smart adjustment for Preferred Text (Lc 90)"
        });
      }
    }
  }

  // Always suggest the optimal black/white as a baseline fallback
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const optimalTextColor = bgLuminance > 0.5 ? "#000000" : "#FFFFFF";
  const optimalTextRgb = hexToRgb(optimalTextColor)!;

  if (mode === 'WCAG') {
    const optimalContrast = getContrastRatio(
      getLuminance(optimalTextRgb.r, optimalTextRgb.g, optimalTextRgb.b),
      bgLuminance
    );
    suggestions.push({
      foreground: optimalTextColor,
      background: background,
      contrast: optimalContrast,
      level: optimalContrast >= 7 ? "AAA" : optimalContrast >= 4.5 ? "AA" : "Fail",
      description: `Maximum contrast ${optimalTextColor === "#000000" ? "black" : "white"}`
    });
  } else {
    const optimalLc = getAPCA(optimalTextRgb, bgRgb);
    if (optimalLc !== null) {
      suggestions.push({
        foreground: optimalTextColor,
        background: background,
        contrast: optimalLc,
        level: Math.abs(optimalLc) >= 90 ? "AAA" : "AA",
        description: `Maximum contrast ${optimalTextColor === "#000000" ? "black" : "white"}`
      });
    }
  }

  return suggestions;
}

export function findClosestAccessibleColor(
  foreground: string,
  background: string,
  targetRatio: number, // Ratio for WCAG or Lc for APCA
  mode: 'WCAG' | 'APCA' = 'WCAG'
): string | null {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  if (!fgRgb || !bgRgb) return null;

  const fgHsl = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);

  let bestColor: string | null = null;
  let minDiff = Infinity;

  // Scan lightness from 0 to 100 in steps of 1
  for (let l = 0; l <= 100; l++) {
    const testRgb = hslToRgb(fgHsl.h, fgHsl.s, l);
    let passes = false;

    if (mode === 'WCAG') {
      const l1 = getLuminance(testRgb.r, testRgb.g, testRgb.b);
      const l2 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      const ratio = getContrastRatio(l1, l2);
      if (ratio >= targetRatio) passes = true;
    } else {
      const lc = getAPCA(testRgb, bgRgb);
      if (lc !== null && Math.abs(lc) >= targetRatio) passes = true;
    }

    if (passes) {
      const diff = Math.abs(l - fgHsl.l);
      if (diff < minDiff) {
        minDiff = diff;
        bestColor = rgbToHex(testRgb.r, testRgb.g, testRgb.b);
      }
    }
  }

  return bestColor;
} 