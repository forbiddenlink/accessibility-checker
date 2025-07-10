import { ColorResult, ColorSuggestion } from '@/types';

const API_ENDPOINT = 'https://webaim.org/resources/contrastchecker/';

export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export const calculateContrast = async (
  foreground: string,
  background: string
): Promise<ColorResult> => {
  try {
    const params = new URLSearchParams({
      fcolor: foreground.replace('#', ''),
      bcolor: background.replace('#', ''),
      api: 'true',
    });

    const response = await fetch(`${API_ENDPOINT}?${params}`);
    
    if (!response.ok) {
      throw new APIError('Failed to calculate contrast ratio');
    }

    const data = await response.json();
    
    return {
      contrast: parseFloat(data.ratio),
      AA: data.AA === 'pass',
      AAA: data.AAA === 'pass',
      AALarge: data.AALarge === 'pass',
      AAALarge: data.AAALarge === 'pass',
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Error calculating contrast ratio');
  }
};

export const getSuggestedColors = async (
  baseColor: string,
  isBackground = false
): Promise<ColorSuggestion[]> => {
  try {
    // This would typically call an API endpoint
    // For now, we'll generate suggestions programmatically
    const suggestions: ColorSuggestion[] = [];
    const baseHex = baseColor.replace('#', '');
    
    // Generate variations of the base color
    const r = parseInt(baseHex.substr(0, 2), 16);
    const g = parseInt(baseHex.substr(2, 2), 16);
    const b = parseInt(baseHex.substr(4, 2), 16);
    
    // Create variations by adjusting brightness
    const variations = [-0.5, -0.25, 0.25, 0.5];
    
    for (const variation of variations) {
      const newR = Math.min(255, Math.max(0, r + (variation * 255)));
      const newG = Math.min(255, Math.max(0, g + (variation * 255)));
      const newB = Math.min(255, Math.max(0, b + (variation * 255)));
      
      const newColor = `#${Math.round(newR).toString(16).padStart(2, '0')}${
        Math.round(newG).toString(16).padStart(2, '0')}${
        Math.round(newB).toString(16).padStart(2, '0')}`;
      
      const contrastColor = isBackground ? baseColor : newColor;
      const bgColor = isBackground ? newColor : baseColor;
      
      const contrast = await calculateContrast(contrastColor, bgColor);
      
      suggestions.push({
        foreground: contrastColor,
        background: bgColor,
        contrast: contrast.contrast,
      });
    }
    
    return suggestions.sort((a, b) => b.contrast - a.contrast);
  } catch (error) {
    throw new APIError('Error generating color suggestions');
  }
};

export const analyzeWebsiteAccessibility = async (url: string) => {
  try {
    // This would typically call an accessibility testing API
    // For now, we'll return a mock response
    return {
      contrast: true,
      semantics: true,
      navigation: true,
      issues: [],
    };
  } catch (error) {
    throw new APIError('Error analyzing website accessibility');
  }
}; 