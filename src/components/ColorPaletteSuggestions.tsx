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
    <div className="glass-morphism p-8 rounded-2xl">
      <h2 className="text-2xl font-semibold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
        Color Palette Suggestions
      </h2>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && palettes.map((palette, index) => (
        <div key={index} className="mb-8 last:mb-0">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">
            {palette.name}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {palette.colors.map((combo, comboIndex) => (
              <div
                key={comboIndex}
                className="bg-white/30 rounded-lg p-4 hover:bg-white/50 transition-colors cursor-pointer"
                onClick={() => onApplyPalette(combo.foreground, combo.background)}
              >
                <div className="flex space-x-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-md shadow-inner border border-slate-200"
                    style={{ backgroundColor: combo.foreground }}
                  />
                  <div
                    className="w-8 h-8 rounded-md shadow-inner border border-slate-200"
                    style={{ backgroundColor: combo.background }}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contrast:</span>
                    <span className="text-sm text-slate-600">
                      {combo.contrast.toFixed(1)}:1
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {combo.AA.normal && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                        AA
                      </span>
                    )}
                    {combo.AAA.normal && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                        AAA
                      </span>
                    )}
                  </div>

                  <div
                    className="mt-2 p-2 rounded text-center"
                    style={{
                      backgroundColor: combo.background,
                      color: combo.foreground,
                    }}
                  >
                    Sample Text
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 