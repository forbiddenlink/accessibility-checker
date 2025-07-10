interface RGB {
  r: number;
  g: number;
  b: number;
}

// WCAG relative luminance coefficients
// See: https://www.w3.org/TR/WCAG20/#relativeluminancedef
const LUMINANCE_COEFFICIENTS = {
  RED: 0.2126,
  GREEN: 0.7152,
  BLUE: 0.0722
} as const;

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