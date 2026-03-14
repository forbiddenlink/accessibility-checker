import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  parseSavedPalettes,
  stringifySavedPalettes,
  type SavedPalette,
} from "@/utils/validation";

interface SavedColorPalettesProps {
  currentForeground: string;
  currentBackground: string;
  contrastRatio: number;
  onApplyPalette: (foreground: string, background: string) => void;
}

export interface SavedColorPalettesRef {
  setShowSaveDialog: (show: boolean) => void;
}

const SavedColorPalettes = forwardRef<
  SavedColorPalettesRef,
  SavedColorPalettesProps
>(
  (
    { currentForeground, currentBackground, contrastRatio, onApplyPalette },
    ref,
  ) => {
    const [palettes, setPalettes] = useState<SavedPalette[]>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [paletteName, setPaletteName] = useState("");

    useImperativeHandle(ref, () => ({
      setShowSaveDialog,
    }));

    // Load saved palettes from localStorage on component mount
    useEffect(() => {
      const savedPalettes = localStorage.getItem("accessibilityPalettes");
      const validatedPalettes = parseSavedPalettes(savedPalettes);
      setPalettes(validatedPalettes);
    }, []);

    // Save palettes to localStorage whenever they change
    useEffect(() => {
      try {
        localStorage.setItem(
          "accessibilityPalettes",
          stringifySavedPalettes(palettes),
        );
      } catch (error) {
        console.error("Failed to persist palettes:", error);
      }
    }, [palettes]);

    const savePalette = () => {
      const newPalette: SavedPalette = {
        id: `palette-${Date.now()}`,
        name: paletteName || `Palette ${palettes.length + 1}`,
        foreground: currentForeground,
        background: currentBackground,
        contrast: contrastRatio,
        timestamp: Date.now(),
      };

      setPalettes([...palettes, newPalette]);
      setShowSaveDialog(false);
      setPaletteName("");
    };

    const deletePalette = (id: string) => {
      setPalettes(palettes.filter((palette) => palette.id !== id));
    };

    return (
      <div className="glass-morphism p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
            Saved Color Combinations
          </h2>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/20"
          >
            Save Current
          </button>
        </div>

        {showSaveDialog && (
          <div className="mb-6 bg-white/10 p-4 rounded-lg border border-white/10 backdrop-blur-md">
            <h3 className="text-lg font-medium mb-3 text-white">
              Save Current Palette
            </h3>
            <div className="mb-4">
              <label
                htmlFor="palette-name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Palette Name
              </label>
              <input
                id="palette-name"
                type="text"
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                className="w-full rounded-md bg-black/50 border-white/10 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-white placeholder-gray-500"
                placeholder="My Color Combination"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="py-2 px-4 border border-white/10 rounded-md text-gray-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePalette}
                className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {palettes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>You haven&apos;t saved any color combinations yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {palettes.map((palette) => (
              <div
                key={palette.id}
                className="bg-white/5 rounded-lg p-4 shadow-sm border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-200">{palette.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        onApplyPalette(palette.foreground, palette.background)
                      }
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => deletePalette(palette.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div
                  className="h-16 rounded-md mb-2 border border-white/10 shadow-inner"
                  style={{
                    backgroundColor: palette.background,
                    color: palette.foreground,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span>Sample Text</span>
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span>FG: {palette.foreground}</span>
                  <span>BG: {palette.background}</span>
                  <span
                    className={`font-medium ${
                      palette.contrast >= 7
                        ? "text-green-400"
                        : palette.contrast >= 4.5
                          ? "text-blue-400"
                          : "text-red-400"
                    }`}
                  >
                    {palette.contrast.toFixed(2)}:1
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

SavedColorPalettes.displayName = "SavedColorPalettes";

export default SavedColorPalettes;
