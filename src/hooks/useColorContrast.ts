import { useState, useEffect, useCallback, useRef } from "react";
import {
  getContrastRatio,
  getAPCA,
  generateColorSuggestions,
  hexToRgb,
  getLuminance,
} from "@/utils/colorUtils";

// Constants
const DEFAULT_COLORS = {
  FOREGROUND: "#000000",
  BACKGROUND: "#FFFFFF",
} as const;

const DEBOUNCE_DELAY = {
  COLOR_CHECK: 0, // Immediate client-side check
  URL_UPDATE: 1000, // ms
} as const;

// Types
export type ContrastMode = "WCAG" | "APCA";

interface ContrastResults {
  contrast: number; // WCAG ratio
  apca: number | null; // APCA Lc
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

type ErrorType = "INVALID_COLOR" | null;

interface ErrorState {
  type: ErrorType;
  message: string;
}

// Utility function for debouncing
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (delay === 0) {
        callback(...args);
        return;
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
}

export default function useColorContrast(
  initialFg = DEFAULT_COLORS.FOREGROUND,
  initialBg = DEFAULT_COLORS.BACKGROUND,
) {
  const [foregroundColor, setForegroundColor] = useState<string>(initialFg);
  const [backgroundColor, setBackgroundColor] = useState<string>(initialBg);
  const [mode, setMode] = useState<ContrastMode>("WCAG");
  const [results, setResults] = useState<ContrastResults | null>(null);
  const [loading, setLoading] = useState<{ colorCheck: boolean }>({
    colorCheck: false,
  });
  const [error, setError] = useState<ErrorState>({ type: null, message: "" });

  // Check if the color is a valid hex format
  const isValidHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

  // Normalize color input
  const normalizeColor = (color: string): string => {
    try {
      if (color[0] !== "#") color = "#" + color;
      if (color.length === 4) {
        const r = color[1],
          g = color[2],
          b = color[3];
        color = `#${r}${r}${g}${g}${b}${b}`;
      }
      return color.toUpperCase();
    } catch (e) {
      throw new Error("Invalid color format");
    }
  };

  const handleForegroundChange = (color: string) => {
    try {
      const normalizedColor = normalizeColor(color);
      if (isValidHexColor(normalizedColor)) {
        setForegroundColor(normalizedColor);
        setError({ type: null, message: "" });
      } else {
        setForegroundColor(color);
        setError({
          type: "INVALID_COLOR",
          message: "Invalid foreground color format",
        });
      }
    } catch (e) {
      setForegroundColor(color);
      setError({
        type: "INVALID_COLOR",
        message: "Invalid foreground color format",
      });
    }
  };

  const handleBackgroundChange = (color: string) => {
    try {
      const normalizedColor = normalizeColor(color);
      if (isValidHexColor(normalizedColor)) {
        setBackgroundColor(normalizedColor);
        setError({ type: null, message: "" });
      } else {
        setBackgroundColor(color);
        setError({
          type: "INVALID_COLOR",
          message: "Invalid background color format",
        });
      }
    } catch (e) {
      setBackgroundColor(color);
      setError({
        type: "INVALID_COLOR",
        message: "Invalid background color format",
      });
    }
  };

  // Synchronous client-side check
  const checkContrast = useCallback(() => {
    if (
      !isValidHexColor(foregroundColor) ||
      !isValidHexColor(backgroundColor)
    ) {
      return;
    }

    setLoading({ colorCheck: true });

    try {
      const fgRgb = hexToRgb(foregroundColor);
      const bgRgb = hexToRgb(backgroundColor);

      if (!fgRgb || !bgRgb) {
        throw new Error("Invalid color conversion");
      }

      // Calculate WCAG
      const fgL = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
      const bgL = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      const contrast = getContrastRatio(fgL, bgL);

      // Calculate APCA
      const apca = getAPCA(fgRgb, bgRgb);

      // Generate suggestions based on current mode
      const suggestions = generateColorSuggestions(
        foregroundColor,
        backgroundColor,
        mode === "WCAG" ? contrast : (apca ?? 0),
        mode,
      );

      setResults({
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
        suggestions,
      });
      setError({ type: null, message: "" });
    } catch (err) {
      console.error(err);
      setError({
        type: "INVALID_COLOR",
        message: "Failed to calculate contrast",
      });
    } finally {
      // Simulate a tiny delay for UI responsiveness or just clear immediately
      // Since it's instant, we don't strictly *need* loading state, but it keeps UI consistent
      setLoading({ colorCheck: false });
    }
  }, [foregroundColor, backgroundColor, mode]);

  // Load colors from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const fgParam = params.get("fg");
      const bgParam = params.get("bg");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (fgParam && isValidHexColor(fgParam))
        setForegroundColor(fgParam.toUpperCase());
      if (bgParam && isValidHexColor(bgParam))
        setBackgroundColor(bgParam.toUpperCase());
    }
  }, []);

  const updateURL = useDebounce(() => {
    if (
      typeof window !== "undefined" &&
      isValidHexColor(foregroundColor) &&
      isValidHexColor(backgroundColor)
    ) {
      const url = new URL(window.location.href);
      url.searchParams.set("fg", foregroundColor);
      url.searchParams.set("bg", backgroundColor);
      window.history.replaceState({}, "", url.toString());
    }
  }, DEBOUNCE_DELAY.URL_UPDATE);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkContrast();
    updateURL();
  }, [foregroundColor, backgroundColor, mode, checkContrast, updateURL]);

  return {
    foregroundColor,
    backgroundColor,
    setForegroundColor: handleForegroundChange,
    setBackgroundColor: handleBackgroundChange,
    results,
    loading,
    error,
    checkContrast,
    isValidColor: isValidHexColor,
    mode,
    setMode,
  };
}
