import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface SavedPalette {
  id: string;
  name: string;
  foreground: string;
  background: string;
  contrast: number;
  timestamp: number;
}

interface SavedColorPalettesProps {
  currentForeground: string;
  currentBackground: string;
  contrastRatio: number;
  onApplyPalette: (foreground: string, background: string) => void;
}

export interface SavedColorPalettesRef {
  setShowSaveDialog: (show: boolean) => void;
}

const SavedColorPalettes = forwardRef<SavedColorPalettesRef, SavedColorPalettesProps>(({
  currentForeground,
  currentBackground,
  contrastRatio,
  onApplyPalette
}, ref) => {
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [paletteName, setPaletteName] = useState('');
  
  useImperativeHandle(ref, () => ({
    setShowSaveDialog
  }));

  // Load saved palettes from localStorage on component mount
  useEffect(() => {
    const savedPalettes = localStorage.getItem('accessibilityPalettes');
    if (savedPalettes) {
      setPalettes(JSON.parse(savedPalettes));
    }
  }, []);
  
  // Save palettes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibilityPalettes', JSON.stringify(palettes));
  }, [palettes]);
  
  const savePalette = () => {
    const newPalette: SavedPalette = {
      id: `palette-${Date.now()}`,
      name: paletteName || `Palette ${palettes.length + 1}`,
      foreground: currentForeground,
      background: currentBackground,
      contrast: contrastRatio,
      timestamp: Date.now()
    };
    
    setPalettes([...palettes, newPalette]);
    setShowSaveDialog(false);
    setPaletteName('');
  };
  
  const deletePalette = (id: string) => {
    setPalettes(palettes.filter(palette => palette.id !== id));
  };
  
  return (
    <div className="glass-morphism p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
          Saved Color Combinations
        </h2>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Current
        </button>
      </div>
      
      {showSaveDialog && (
        <div className="mb-6 bg-white/70 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Save Current Palette</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Palette Name
            </label>
            <input
              type="text"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="My Color Combination"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="py-2 px-4 border border-gray-300 rounded-md text-slate-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={savePalette}
              className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      {palettes.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>You haven't saved any color combinations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {palettes.map(palette => (
            <div key={palette.id} className="bg-white/50 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{palette.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onApplyPalette(palette.foreground, palette.background)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => deletePalette(palette.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div 
                className="h-16 rounded-md mb-2"
                style={{
                  backgroundColor: palette.background,
                  color: palette.foreground,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span>Sample Text</span>
              </div>
              
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  FG: {palette.foreground}
                </span>
                <span>
                  BG: {palette.background}
                </span>
                <span className={`font-medium ${
                  palette.contrast >= 7 ? 'text-green-600' : 
                  palette.contrast >= 4.5 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {palette.contrast.toFixed(2)}:1
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default SavedColorPalettes; 