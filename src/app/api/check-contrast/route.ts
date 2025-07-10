import { NextResponse } from "next/server";

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function adjustColorForContrast(foreground: RGB, background: RGB, targetContrast: number): RGB {
  // Calculate current contrast
  const fgLuminance = getLuminance(foreground.r, foreground.g, foreground.b);
  const bgLuminance = getLuminance(background.r, background.g, background.b);
  let currentContrast = getContrastRatio(fgLuminance, bgLuminance);
  
  // Determine if we need to lighten or darken
  const shouldLighten = bgLuminance < 0.5;
  
  // Clone the foreground color
  let adjustedColor: RGB = { ...foreground };
  
  // Maximum number of iterations to avoid infinite loops
  const maxIterations = 100;
  let iterations = 0;
  
  // Adjust color until we meet contrast target or reach max iterations
  while (currentContrast < targetContrast && iterations < maxIterations) {
    if (shouldLighten) {
      // Lighten the color
      adjustedColor.r = Math.min(255, adjustedColor.r + 5);
      adjustedColor.g = Math.min(255, adjustedColor.g + 5);
      adjustedColor.b = Math.min(255, adjustedColor.b + 5);
    } else {
      // Darken the color
      adjustedColor.r = Math.max(0, adjustedColor.r - 5);
      adjustedColor.g = Math.max(0, adjustedColor.g - 5);
      adjustedColor.b = Math.max(0, adjustedColor.b - 5);
    }
    
    // Recalculate luminance and contrast
    const newLuminance = getLuminance(adjustedColor.r, adjustedColor.g, adjustedColor.b);
    currentContrast = getContrastRatio(newLuminance, bgLuminance);
    iterations++;
  }
  
  return adjustedColor;
}

function generateColorSuggestions(foreground: string, background: string, contrast: number) {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) return [];
  
  const suggestions = [];
  
  // If contrast is below AA level (4.5:1), offer suggestions
  if (contrast < 4.5) {
    // 1. Adjust foreground to meet AA (4.5:1)
    const adjustedForAA = adjustColorForContrast(fgRgb, bgRgb, 4.5);
    suggestions.push({
      foreground: rgbToHex(adjustedForAA.r, adjustedForAA.g, adjustedForAA.b),
      background: background,
      contrast: 4.5,
      level: "AA",
      description: "Adjusted text color for AA compliance"
    });
    
    // 2. Adjust foreground to meet AAA (7:1)
    const adjustedForAAA = adjustColorForContrast(fgRgb, bgRgb, 7);
    suggestions.push({
      foreground: rgbToHex(adjustedForAAA.r, adjustedForAAA.g, adjustedForAAA.b),
      background: background,
      contrast: 7,
      level: "AAA",
      description: "Adjusted text color for AAA compliance"
    });
    
    // 3. Suggest black or white text based on background luminance
    const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const optimalTextColor = bgLuminance > 0.5 ? "#000000" : "#FFFFFF";
    const optimalTextRgb = hexToRgb(optimalTextColor)!;
    const optimalContrast = getContrastRatio(
      getLuminance(optimalTextRgb.r, optimalTextRgb.g, optimalTextRgb.b),
      bgLuminance
    );
    
    suggestions.push({
      foreground: optimalTextColor,
      background: background,
      contrast: optimalContrast,
      level: optimalContrast >= 7 ? "AAA" : optimalContrast >= 4.5 ? "AA" : "Fail",
      description: `Optimal ${optimalTextColor === "#000000" ? "black" : "white"} text on this background`
    });
  }
  
  return suggestions;
}

export async function POST(request: Request) {
  try {
    const { foreground, background } = await request.json();

    const fgColor = hexToRgb(foreground);
    const bgColor = hexToRgb(background);

    if (!fgColor || !bgColor) {
      return NextResponse.json(
        { error: "Invalid color format" },
        { status: 400 }
      );
    }

    const fgLuminance = getLuminance(fgColor.r, fgColor.g, fgColor.b);
    const bgLuminance = getLuminance(bgColor.r, bgColor.g, bgColor.b);
    const contrast = getContrastRatio(fgLuminance, bgLuminance);
    
    // Generate suggestions if contrast is below WCAG AA level
    const suggestions = contrast < 4.5 
      ? generateColorSuggestions(foreground, background, contrast)
      : [];

    return NextResponse.json({
      contrast,
      AA: {
        normal: contrast >= 4.5,
        large: contrast >= 3,
      },
      AAA: {
        normal: contrast >= 7,
        large: contrast >= 4.5,
      },
      suggestions
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 