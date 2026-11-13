// Grey steps for the hero "step wedge". Each step is a neutral warm grey whose
// WCAG 2 contrast against the page ground equals its printed target ratio, so
// the numbers under the strip are measurements, not decoration.

export const PAPER = "#F4F1EA";
export const DARKROOM = "#11100E";

export const WEDGE_TARGETS = [
  1.2, 1.5, 2, 2.5, 3, 4, 4.5, 5.5, 7, 9, 12, 16,
] as const;

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * toLinear((n >> 16) & 255) +
    0.7152 * toLinear((n >> 8) & 255) +
    0.0722 * toLinear(n & 255)
  );
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function fromLuminance(l: number): string {
  const c = Math.min(Math.max(l, 0), 1);
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  const v = Math.round(s * 255);
  const h = v.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
}

/** Grey whose contrast against `ground` is at least `ratio` (never under it, so a printed 4.5 really passes 4.5). */
export function stepHex(ratio: number, ground: string): string {
  const lg = luminance(ground);
  const light = lg > 0.18;
  let l = light ? (lg + 0.05) / ratio - 0.05 : ratio * (lg + 0.05) - 0.05;
  let hex = fromLuminance(l);
  // Rounding to 8 bits can land a hair under the target; walk one level at a time.
  for (let i = 0; i < 6 && contrast(hex, ground) < ratio; i += 1) {
    l += light ? -0.002 : 0.002;
    hex = fromLuminance(l);
  }
  return hex;
}

export interface WedgeStep {
  ratio: number;
  light: string;
  dark: string;
}

export function buildWedge(): WedgeStep[] {
  return WEDGE_TARGETS.map((ratio) => ({
    ratio,
    light: stepHex(ratio, PAPER),
    dark: stepHex(ratio, DARKROOM),
  }));
}
