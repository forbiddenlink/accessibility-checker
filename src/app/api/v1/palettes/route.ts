import { NextResponse } from 'next/server';
import { getLuminance, getContrastRatio, hexToRgb, rgbToHex } from '@/utils/colorUtils';

// Base colors that work well for accessibility
const baseColors = [
  '#000000', // Black
  '#FFFFFF', // White
  '#1A365D', // Navy
  '#2C5282', // Blue
  '#2D3748', // Gray
  '#48BB78', // Green
  '#9F7AEA', // Purple
  '#ED8936', // Orange
  '#E53E3E', // Red
  '#EDF2F7', // Light Gray
];

interface ColorPalette {
  name: string;
  colors: {
    foreground: string;
    background: string;
    contrast: number;
    AA: {
      normal: boolean;
      large: boolean;
    };
    AAA: {
      normal: boolean;
      large: boolean;
    };
  }[];
}

function generateAccessiblePalette(baseColor: string): ColorPalette['colors'] {
  const baseRgb = hexToRgb(baseColor);
  if (!baseRgb) return [];

  const combinations = baseColors
    .map(color => {
      const rgb = hexToRgb(color);
      if (!rgb) return null;

      const contrast = getContrastRatio(
        getLuminance(baseRgb.r, baseRgb.g, baseRgb.b),
        getLuminance(rgb.r, rgb.g, rgb.b)
      );

      return {
        foreground: baseColor,
        background: color,
        contrast,
        AA: {
          normal: contrast >= 4.5,
          large: contrast >= 3,
        },
        AAA: {
          normal: contrast >= 7,
          large: contrast >= 4.5,
        },
      };
    })
    .filter((combo): combo is NonNullable<typeof combo> => 
      combo !== null && (combo.AA.normal || combo.AA.large)
    )
    .sort((a, b) => b.contrast - a.contrast);

  return combinations;
}

function generateAnalogousPalette(baseColor: string): ColorPalette['colors'] {
  const baseRgb = hexToRgb(baseColor);
  if (!baseRgb) return [];

  // Generate analogous colors (30° apart)
  const hslBase = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
  const analogousHues = [
    (hslBase.h - 30 + 360) % 360,
    hslBase.h,
    (hslBase.h + 30) % 360,
  ];

  const combinations = analogousHues
    .flatMap(hue => {
      const rgb = hslToRgb(hue, hslBase.s, hslBase.l);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      
      return baseColors.map(background => {
        const bgRgb = hexToRgb(background);
        if (!bgRgb) return null;

        const contrast = getContrastRatio(
          getLuminance(rgb.r, rgb.g, rgb.b),
          getLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
        );

        return {
          foreground: hex,
          background,
          contrast,
          AA: {
            normal: contrast >= 4.5,
            large: contrast >= 3,
          },
          AAA: {
            normal: contrast >= 7,
            large: contrast >= 4.5,
          },
        };
      });
    })
    .filter((combo): combo is NonNullable<typeof combo> => 
      combo !== null && (combo.AA.normal || combo.AA.large)
    )
    .sort((a, b) => b.contrast - a.contrast);

  return combinations;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h *= 60;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, (h / 360 + 1/3));
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, (h / 360 - 1/3));
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export async function POST(request: Request) {
  try {
    const { color, type = 'accessible' } = await request.json();

    // Validate input
    if (!color) {
      return NextResponse.json(
        { error: 'Base color is required' },
        { status: 400 }
      );
    }

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      return NextResponse.json(
        { error: 'Color must be in valid hex format (e.g., #FF0000)' },
        { status: 400 }
      );
    }

    let palettes: ColorPalette[] = [];

    if (type === 'accessible') {
      const accessibleCombos = generateAccessiblePalette(color);
      palettes.push({
        name: 'Accessible Combinations',
        colors: accessibleCombos,
      });
    } else if (type === 'analogous') {
      const analogousCombos = generateAnalogousPalette(color);
      palettes.push({
        name: 'Analogous Combinations',
        colors: analogousCombos,
      });
    } else {
      // Generate both types
      const accessibleCombos = generateAccessiblePalette(color);
      const analogousCombos = generateAnalogousPalette(color);
      
      palettes = [
        {
          name: 'Accessible Combinations',
          colors: accessibleCombos,
        },
        {
          name: 'Analogous Combinations',
          colors: analogousCombos,
        },
      ];
    }

    return NextResponse.json({ palettes });
  } catch (error) {
    console.error('Error generating color palettes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 