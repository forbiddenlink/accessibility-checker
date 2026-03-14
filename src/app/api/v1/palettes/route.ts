import { NextResponse } from "next/server";
import {
  getLuminance,
  getContrastRatio,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
} from "@/utils/colorUtils";

// Base colors that work well for accessibility
const baseColors = [
  "#000000", // Black
  "#FFFFFF", // White
  "#1A365D", // Navy
  "#2C5282", // Blue
  "#2D3748", // Gray
  "#48BB78", // Green
  "#9F7AEA", // Purple
  "#ED8936", // Orange
  "#E53E3E", // Red
  "#EDF2F7", // Light Gray
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

function generateAccessiblePalette(baseColor: string): ColorPalette["colors"] {
  const baseRgb = hexToRgb(baseColor);
  if (!baseRgb) return [];

  const combinations = baseColors
    .map((color) => {
      const rgb = hexToRgb(color);
      if (!rgb) return null;

      const contrast = getContrastRatio(
        getLuminance(baseRgb.r, baseRgb.g, baseRgb.b),
        getLuminance(rgb.r, rgb.g, rgb.b),
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
    .filter(
      (combo): combo is NonNullable<typeof combo> =>
        combo !== null && (combo.AA.normal || combo.AA.large),
    )
    .sort((a, b) => b.contrast - a.contrast);

  return combinations;
}

function generateAnalogousPalette(baseColor: string): ColorPalette["colors"] {
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
    .flatMap((hue) => {
      const rgb = hslToRgb(hue, hslBase.s, hslBase.l);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

      return baseColors.map((background) => {
        const bgRgb = hexToRgb(background);
        if (!bgRgb) return null;

        const contrast = getContrastRatio(
          getLuminance(rgb.r, rgb.g, rgb.b),
          getLuminance(bgRgb.r, bgRgb.g, bgRgb.b),
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
    .filter(
      (combo): combo is NonNullable<typeof combo> =>
        combo !== null && (combo.AA.normal || combo.AA.large),
    )
    .sort((a, b) => b.contrast - a.contrast);

  return combinations;
}

export async function POST(request: Request) {
  try {
    const { color, type = "accessible" } = await request.json();

    // Validate input
    if (!color) {
      return NextResponse.json(
        { error: "Base color is required" },
        { status: 400 },
      );
    }

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      return NextResponse.json(
        { error: "Color must be in valid hex format (e.g., #FF0000)" },
        { status: 400 },
      );
    }

    let palettes: ColorPalette[] = [];

    if (type === "accessible") {
      const accessibleCombos = generateAccessiblePalette(color);
      palettes.push({
        name: "Accessible Combinations",
        colors: accessibleCombos,
      });
    } else if (type === "analogous") {
      const analogousCombos = generateAnalogousPalette(color);
      palettes.push({
        name: "Analogous Combinations",
        colors: analogousCombos,
      });
    } else {
      // Generate both types
      const accessibleCombos = generateAccessiblePalette(color);
      const analogousCombos = generateAnalogousPalette(color);

      palettes = [
        {
          name: "Accessible Combinations",
          colors: accessibleCombos,
        },
        {
          name: "Analogous Combinations",
          colors: analogousCombos,
        },
      ];
    }

    return NextResponse.json({ palettes });
  } catch (error) {
    console.error(
      "Error generating color palettes:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
