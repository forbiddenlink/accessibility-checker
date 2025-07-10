interface ColorSuggestionsProps {
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  suggestions: Array<{
    foreground: string;
    background: string;
    contrast: number;
    level: string;
    description: string;
  }>;
  onApplySuggestion?: (foreground: string, background: string) => void;
}

export default function ColorSuggestions({ 
  foregroundColor, 
  backgroundColor, 
  contrastRatio,
  suggestions,
  onApplySuggestion 
}: ColorSuggestionsProps) {
  if (suggestions.length === 0 || contrastRatio >= 4.5) {
    return (
      <div className="glass-morphism p-6 rounded-xl mb-8">
        <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
          Color Suggestions
        </h2>
        
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-green-700">
            Your current color combination meets WCAG AA standards! No changes needed.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-morphism p-6 rounded-xl mb-8">
      <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
        Color Suggestions
      </h2>
      
      <p className="text-slate-600 mb-4">
        Here are some suggested alternatives that would improve accessibility:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white/50 p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{suggestion.description}</span>
              <button 
                onClick={() => onApplySuggestion?.(suggestion.foreground, suggestion.background)}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
              >
                Apply
              </button>
            </div>
            <div 
              className="p-4 rounded border"
              style={{ 
                backgroundColor: suggestion.background,
                color: suggestion.foreground 
              }}
            >
              <p>Sample text with improved contrast</p>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              <span className="mr-2">
                FG: {suggestion.foreground}
              </span>
              <span>
                BG: {suggestion.background}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 