import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface SavedPalette {
  id: string;
  name: string;
  foreground: string;
  background: string;
  contrast: number;
  timestamp: number;
}

interface PaletteState {
  // State
  palettes: SavedPalette[];

  // Actions
  addPalette: (palette: Omit<SavedPalette, 'id' | 'timestamp'>) => void;
  removePalette: (id: string) => void;
  updatePalette: (id: string, updates: Partial<Omit<SavedPalette, 'id' | 'timestamp'>>) => void;
  renamePalette: (id: string, name: string) => void;
  clearAllPalettes: () => void;
  importPalettes: (palettes: SavedPalette[]) => void;
  duplicatePalette: (id: string) => void;
}

// Generate unique ID
const generateId = (): string => `palette-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set, get) => ({
      // Initial state
      palettes: [],

      // Actions
      addPalette: (palette) => {
        const newPalette: SavedPalette = {
          ...palette,
          id: generateId(),
          timestamp: Date.now()
        };

        set((state) => ({
          palettes: [...state.palettes, newPalette]
        }));
      },

      removePalette: (id) => {
        set((state) => ({
          palettes: state.palettes.filter((p) => p.id !== id)
        }));
      },

      updatePalette: (id, updates) => {
        set((state) => ({
          palettes: state.palettes.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          )
        }));
      },

      renamePalette: (id, name) => {
        set((state) => ({
          palettes: state.palettes.map((p) =>
            p.id === id ? { ...p, name } : p
          )
        }));
      },

      clearAllPalettes: () => {
        set({ palettes: [] });
      },

      importPalettes: (palettes) => {
        // Merge imported palettes, avoiding duplicates by id
        set((state) => {
          const existingIds = new Set(state.palettes.map((p) => p.id));
          const newPalettes = palettes.filter((p) => !existingIds.has(p.id));
          return {
            palettes: [...state.palettes, ...newPalettes]
          };
        });
      },

      duplicatePalette: (id) => {
        const { palettes, addPalette } = get();
        const palette = palettes.find((p) => p.id === id);
        if (palette) {
          addPalette({
            name: `${palette.name} (copy)`,
            foreground: palette.foreground,
            background: palette.background,
            contrast: palette.contrast
          });
        }
      }
    }),
    {
      name: 'accessibilityPalettes',
      storage: createJSONStorage(() => localStorage),
      // Only persist palettes array
      partialize: (state) => ({ palettes: state.palettes })
    }
  )
);

// Selectors for derived state
export const selectPaletteById = (id: string) => (state: PaletteState): SavedPalette | undefined => {
  return state.palettes.find((p) => p.id === id);
};

export const selectPalettesByContrast = (minContrast: number) => (state: PaletteState): SavedPalette[] => {
  return state.palettes.filter((p) => p.contrast >= minContrast);
};

export const selectPalettesSortedByDate = (state: PaletteState): SavedPalette[] => {
  return [...state.palettes].sort((a, b) => b.timestamp - a.timestamp);
};

export const selectPalettesSortedByContrast = (state: PaletteState): SavedPalette[] => {
  return [...state.palettes].sort((a, b) => b.contrast - a.contrast);
};

export const selectPalettesCount = (state: PaletteState): number => {
  return state.palettes.length;
};

export const selectAACompliantPalettes = (state: PaletteState): SavedPalette[] => {
  return state.palettes.filter((p) => p.contrast >= 4.5);
};

export const selectAAACompliantPalettes = (state: PaletteState): SavedPalette[] => {
  return state.palettes.filter((p) => p.contrast >= 7);
};
