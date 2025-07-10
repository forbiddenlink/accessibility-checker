import { useState, useEffect, useCallback, useRef } from 'react';

// Constants
const DEFAULT_COLORS = {
  FOREGROUND: '#000000',
  BACKGROUND: '#FFFFFF'
} as const;

const DEBOUNCE_DELAY = {
  COLOR_CHECK: 500,  // ms
  URL_UPDATE: 1000   // ms
} as const;

// Types
interface ContrastResults {
  contrast: number;
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

type LoadingState = {
  colorCheck: boolean;
  urlUpdate: boolean;
};

type ErrorType = 'INVALID_COLOR' | 'API_ERROR' | 'NETWORK_ERROR' | null;

interface ErrorState {
  type: ErrorType;
  message: string;
}

// Utility function for debouncing
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export default function useColorContrast(
  initialFg = DEFAULT_COLORS.FOREGROUND,
  initialBg = DEFAULT_COLORS.BACKGROUND,
  options = { debounceDelay: DEBOUNCE_DELAY.COLOR_CHECK }
) {
  const [foregroundColor, setForegroundColor] = useState<string>(initialFg);
  const [backgroundColor, setBackgroundColor] = useState<string>(initialBg);
  const [results, setResults] = useState<ContrastResults | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    colorCheck: false,
    urlUpdate: false
  });
  const [error, setError] = useState<ErrorState>({
    type: null,
    message: ''
  });

  // Check if the color is a valid hex format
  const isValidHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

  // Normalize color input (add # if missing, convert short hex to long hex)
  const normalizeColor = (color: string): string => {
    try {
      // Add # if missing
      if (color[0] !== '#') {
        color = '#' + color;
      }
      
      // Convert 3-char hex to 6-char hex
      if (color.length === 4) {
        const r = color[1];
        const g = color[2];
        const b = color[3];
        color = `#${r}${r}${g}${g}${b}${b}`;
      }
      
      return color.toUpperCase();
    } catch (e) {
      throw new Error('Invalid color format');
    }
  };

  // Handler for foreground color change with validation
  const handleForegroundChange = (color: string) => {
    try {
      const normalizedColor = normalizeColor(color);
      if (isValidHexColor(normalizedColor)) {
        setForegroundColor(normalizedColor);
        setError({ type: null, message: '' });
      } else {
        setForegroundColor(color); // Keep the invalid input in the state for UX purposes
        setError({
          type: 'INVALID_COLOR',
          message: 'Invalid foreground color format'
        });
      }
    } catch (e) {
      setForegroundColor(color);
      setError({
        type: 'INVALID_COLOR',
        message: 'Invalid foreground color format'
      });
    }
  };

  // Handler for background color change with validation
  const handleBackgroundChange = (color: string) => {
    try {
      const normalizedColor = normalizeColor(color);
      if (isValidHexColor(normalizedColor)) {
        setBackgroundColor(normalizedColor);
        setError({ type: null, message: '' });
      } else {
        setBackgroundColor(color); // Keep the invalid input in the state for UX purposes
        setError({
          type: 'INVALID_COLOR',
          message: 'Invalid background color format'
        });
      }
    } catch (e) {
      setBackgroundColor(color);
      setError({
        type: 'INVALID_COLOR',
        message: 'Invalid background color format'
      });
    }
  };

  // Function to check contrast
  const checkContrast = useCallback(async () => {
    // Validate colors before making the API call
    if (!isValidHexColor(foregroundColor) || !isValidHexColor(backgroundColor)) {
      setError({
        type: 'INVALID_COLOR',
        message: 'Please enter valid hex color values'
      });
      return;
    }

    setLoading(prev => ({ ...prev, colorCheck: true }));
    setError({ type: null, message: '' });
    
    try {
      const response = await fetch('/api/check-contrast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foreground: foregroundColor,
          background: backgroundColor,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      const isNetworkError = err instanceof TypeError && err.message === 'Failed to fetch';
      setError({
        type: isNetworkError ? 'NETWORK_ERROR' : 'API_ERROR',
        message: isNetworkError ? 
          'Network error. Please check your connection.' : 
          'Failed to check colors. Please try again.'
      });
    } finally {
      setLoading(prev => ({ ...prev, colorCheck: false }));
    }
  }, [foregroundColor, backgroundColor]);

  // Debounced contrast check
  const debouncedCheckContrast = useDebounce(checkContrast, options.debounceDelay);

  // Load colors from URL if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fgParam = params.get('fg');
      const bgParam = params.get('bg');
      
      if (fgParam && isValidHexColor(fgParam)) {
        setForegroundColor(fgParam.toUpperCase());
      }
      
      if (bgParam && isValidHexColor(bgParam)) {
        setBackgroundColor(bgParam.toUpperCase());
      }
    }
  }, []);

  // Update URL with current colors (debounced)
  const updateURL = useDebounce(() => {
    if (typeof window !== 'undefined' && 
        isValidHexColor(foregroundColor) && 
        isValidHexColor(backgroundColor)) {
      const url = new URL(window.location.href);
      url.searchParams.set('fg', foregroundColor);
      url.searchParams.set('bg', backgroundColor);
      window.history.replaceState({}, '', url.toString());
    }
  }, DEBOUNCE_DELAY.URL_UPDATE);

  // Auto-check contrast when colors change
  useEffect(() => {
    if (isValidHexColor(foregroundColor) && isValidHexColor(backgroundColor)) {
      debouncedCheckContrast();
      updateURL();
    }
  }, [foregroundColor, backgroundColor, debouncedCheckContrast]);

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
  };
} 