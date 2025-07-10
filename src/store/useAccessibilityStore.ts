import { create } from 'zustand';
import { ColorContrastState, ColorResult, AccessibilityError } from '@/types';

interface AccessibilityStore extends ColorContrastState {
  setColors: (foreground: string, background: string) => void;
  setResults: (results: ColorResult | null) => void;
  setLoading: (key: keyof ColorContrastState['loading'], value: boolean) => void;
  setError: (error: AccessibilityError) => void;
  resetError: () => void;
  resetState: () => void;
}

const initialState: ColorContrastState = {
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  results: null,
  loading: {
    colorCheck: false,
    suggestions: false,
  },
  error: {
    type: null,
    message: '',
  },
};

export const useAccessibilityStore = create<AccessibilityStore>((set) => ({
  ...initialState,

  setColors: (foreground: string, background: string) =>
    set(() => ({
      foregroundColor: foreground,
      backgroundColor: background,
    })),

  setResults: (results: ColorResult | null) =>
    set(() => ({
      results,
    })),

  setLoading: (key: keyof ColorContrastState['loading'], value: boolean) =>
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: value,
      },
    })),

  setError: (error: AccessibilityError) =>
    set(() => ({
      error,
    })),

  resetError: () =>
    set(() => ({
      error: initialState.error,
    })),

  resetState: () =>
    set(() => ({
      ...initialState,
    })),
})); 