export interface ColorResult {
  contrast: number;
  AA: boolean;
  AAA: boolean;
  AALarge: boolean;
  AAALarge: boolean;
}

export interface ColorSuggestion {
  foreground: string;
  background: string;
  contrast: number;
}

export interface SavedPalette {
  id: string;
  name: string;
  foreground: string;
  background: string;
  contrast: number;
  createdAt: string;
}

export interface AccessibilityError {
  type: 'contrast' | 'input' | 'api' | 'validation' | null;
  message: string;
}

export interface ColorContrastState {
  foregroundColor: string;
  backgroundColor: string;
  results: ColorResult | null;
  loading: {
    colorCheck: boolean;
    suggestions: boolean;
  };
  error: AccessibilityError;
}

export interface KeyboardNavigationResult {
  focusableElements: number;
  skipLinks: number;
  focusOrder: boolean;
  visibleFocus: boolean;
  issues: Array<{
    type: string;
    description: string;
    element: string;
  }>;
}

export interface SemanticAnalysisResult {
  headingStructure: boolean;
  ariaLabels: boolean;
  semanticElements: boolean;
  formLabels: boolean;
  issues: Array<{
    type: string;
    description: string;
    element: string;
  }>;
}

export type ColorMode = 'hex' | 'rgb' | 'hsl';

export interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  mode?: ColorMode;
}

export interface AccessibilityTipProps {
  title: string;
  children: React.ReactNode;
}

export interface ExportResultsProps {
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagAA: {
    normal: boolean;
    large: boolean;
  };
  wcagAAA: {
    normal: boolean;
    large: boolean;
  };
}
