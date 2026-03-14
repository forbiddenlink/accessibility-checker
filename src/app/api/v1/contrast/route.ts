import { NextResponse } from "next/server";
import { getLuminance, getContrastRatio, hexToRgb } from "@/utils/colorUtils";

export async function POST(request: Request) {
  try {
    const { foreground, background } = await request.json();

    // Validate input
    if (!foreground || !background) {
      return NextResponse.json(
        { error: "Both foreground and background colors are required" },
        { status: 400 },
      );
    }

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(foreground) || !hexColorRegex.test(background)) {
      return NextResponse.json(
        { error: "Colors must be in valid hex format (e.g., #FF0000)" },
        { status: 400 },
      );
    }

    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    if (!fgRgb || !bgRgb) {
      return NextResponse.json(
        { error: "Invalid color values" },
        { status: 400 },
      );
    }

    const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const contrast = getContrastRatio(fgLuminance, bgLuminance);

    // WCAG 2.1 compliance checks
    const results = {
      contrast,
      AA: {
        normal: contrast >= 4.5,
        large: contrast >= 3,
      },
      AAA: {
        normal: contrast >= 7,
        large: contrast >= 4.5,
      },
      foreground,
      background,
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      "Error processing contrast check:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
