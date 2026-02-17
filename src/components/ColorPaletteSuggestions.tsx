import { useState, useEffect } from 'react';

interface ColorPaletteSuggestionsProps {
  baseColor: string;
  onApplyPalette: (foreground: string, background: string) => void;
}

interface ColorCombination {
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
}

interface Palette {
  name: string;
  colors: ColorCombination[];
}

export default function ColorPaletteSuggestions({
  baseColor,
  onApplyPalette
}: ColorPaletteSuggestionsProps) {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPalettes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/v1/palettes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            color: baseColor,
            type: 'all'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch color palettes');
        }

        const data = await response.json();
        setPalettes(data.palettes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (baseColor) {
      fetchPalettes();
    }
  }, [baseColor]);

  if (!baseColor) return null;

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="badge-fail p-4 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && palettes.map((palette, index) => (
        <div key={index} className="space-y-4">
          <h3 className="text-body-sm font-semibold text-white">
            {palette.name}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {palette.colors.map((combo, comboIndex) => (
              <button
                key={comboIndex}
                type="button"
                className="w-full text-left bg-white/5 rounded-lg p-3 hover:bg-white/8 transition-colors cursor-pointer border border-white/8 hover:border-white/12"
                onClick={() => onApplyPalette(combo.foreground, combo.background)}
              >
                <div className="flex gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded border border-white/10"
                    style={{ backgroundColor: combo.foreground }}
                  />
                  <div
                    className="w-6 h-6 rounded border border-white/10"
                    style={{ backgroundColor: combo.background }}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-muted-foreground">Contrast:</span>
                    <span className="text-caption text-foreground/80">
                      {combo.contrast.toFixed(1)}:1
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {combo.AA.normal && (
                      <span className="badge-pass text-caption px-1.5 py-0.5 rounded">
                        AA
                      </span>
                    )}
                    {combo.AAA.normal && (
                      <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-caption px-1.5 py-0.5 rounded">
                        AAA
                      </span>
                    )}
                  </div>

                  <div
                    className="mt-2 p-2 rounded text-center text-body-sm"
                    style={{
                      backgroundColor: combo.background,
                      color: combo.foreground,
                    }}
                  >
                    Sample
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 
