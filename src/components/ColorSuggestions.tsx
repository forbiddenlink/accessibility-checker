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
  mode?: 'WCAG' | 'APCA';
}

export default function ColorSuggestions({
  foregroundColor,
  backgroundColor,
  contrastRatio,
  suggestions,
  onApplySuggestion,
  mode = 'WCAG'
}: ColorSuggestionsProps) {
  const isGoodEnough = mode === 'APCA'
    ? Math.abs(contrastRatio) >= 75
    : contrastRatio >= 4.5;

  if (suggestions.length === 0 || isGoodEnough) {
    return (
      <div className="space-y-4">
        <div className="badge-pass p-4 rounded-lg">
          <p>
            {mode === 'APCA'
              ? `Your current color combination (Lc ${Math.round(Math.abs(contrastRatio))}) meets APCA standards!`
              : "Your current color combination meets WCAG AA standards! No changes needed."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-body-sm">
        Suggested alternatives to improve accessibility:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/8 hover:bg-white/8 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-white text-body-sm">{suggestion.description}</span>
                <span className="text-caption text-muted-foreground">
                  {mode === 'APCA'
                    ? `Lc ${Math.round(Math.abs(suggestion.contrast))}`
                    : `${suggestion.contrast.toFixed(2)}:1`}
                </span>
              </div>
              <button
                onClick={() => onApplySuggestion?.(suggestion.foreground, suggestion.background)}
                className="flex items-center text-body-sm text-accent hover:text-white px-3 py-1.5 rounded-md hover:bg-accent/10 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Apply
              </button>
            </div>
            <div
              className="p-4 rounded-md border border-white/10"
              style={{
                backgroundColor: suggestion.background,
                color: suggestion.foreground
              }}
            >
              <p className="text-body-sm">Sample text with improved contrast</p>
            </div>
            <div className="mt-2 text-caption text-muted-foreground font-mono">
              <span className="mr-3">FG: {suggestion.foreground}</span>
              <span>BG: {suggestion.background}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 