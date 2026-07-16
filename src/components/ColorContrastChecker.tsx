"use client";

import { useRef, useEffect, useCallback } from "react";
import ColorResult from "@/components/ColorResult";
import ColorPicker from "@/components/ColorPicker";
import ColorSuggestions from "@/components/ColorSuggestions";
import SavedColorPalettes from "@/components/SavedColorPalettes";
import ColorPaletteSuggestions from "@/components/ColorPaletteSuggestions";
import KeyboardNavigationChecker from "@/components/KeyboardNavigationChecker";
import SemanticStructureAnalyzer from "@/components/SemanticStructureAnalyzer";
import WebsiteAnalyzer from "@/components/WebsiteAnalyzer";
import useColorContrast from "@/hooks/useColorContrast";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// jspdf is ~200KB gzipped and is only needed once a user actually exports, so
// keep it out of the initial bundle.
const ExportResults = dynamic(() => import("@/components/ExportResults"), {
  ssr: false,
});

const ColorBlindnessSimulation = dynamic(
  () => import("@/components/ColorBlindnessSimulation"),
  { ssr: false },
);

// Dynamically import components to avoid SSR issues
const ImageAnalyzer = dynamic(() => import("@/components/ImageAnalyzer"), {
  ssr: false,
  loading: () => (
    <div className="glass-card p-8 rounded-xl animate-pulse">
      <div className="h-8 bg-white/10 rounded w-1/3 mb-8"></div>
      <div className="space-y-4">
        <div className="h-10 bg-white/10 rounded"></div>
        <div className="h-40 bg-white/10 rounded"></div>
      </div>
    </div>
  ),
});

const FormAccessibilityAnalyzer = dynamic(
  () => import("@/components/FormAccessibilityAnalyzer"),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card p-8 rounded-xl animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-8"></div>
        <div className="space-y-4">
          <div className="h-10 bg-white/10 rounded"></div>
          <div className="h-40 bg-white/10 rounded"></div>
        </div>
      </div>
    ),
  },
);

const DynamicContentAnalyzer = dynamic(
  () => import("@/components/DynamicContentAnalyzer"),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card p-8 rounded-xl animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-8"></div>
        <div className="space-y-4">
          <div className="h-10 bg-white/10 rounded"></div>
          <div className="h-40 bg-white/10 rounded"></div>
        </div>
      </div>
    ),
  },
);

export default function ColorContrastChecker() {
  const {
    foregroundColor,
    backgroundColor,
    setForegroundColor,
    setBackgroundColor,
    results,
    loading,
    error,
    checkContrast,
    mode,
    setMode,
  } = useColorContrast();

  const savedPalettesRef = useRef<{
    setShowSaveDialog: (show: boolean) => void;
  }>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to check contrast
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        checkContrast();
      }

      // Ctrl/Cmd + S to save current palette
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && results) {
        e.preventDefault();
        savedPalettesRef.current?.setShowSaveDialog(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [results, checkContrast]);

  const handleApplyPalette = useCallback(
    (foreground: string, background: string) => {
      setForegroundColor(foreground);
      setBackgroundColor(background);
    },
    [setForegroundColor, setBackgroundColor],
  );

  return (
    <>
      {/* Main Control Deck */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Color Pickers - 4 cols */}
        <div className="col-span-1 md:col-span-4 glass-card rounded-xl p-6 space-y-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <h2 className="text-caption text-muted-foreground uppercase tracking-widest mb-6">
              Input Parameters
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <ColorPicker
                  label="Foreground"
                  color={foregroundColor}
                  onChange={setForegroundColor}
                />
              </div>
              <div className="space-y-2">
                <ColorPicker
                  label="Background"
                  color={backgroundColor}
                  onChange={setBackgroundColor}
                />
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={checkContrast}
                disabled={loading.colorCheck}
                className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                {loading.colorCheck ? (
                  <span>Analyzing...</span>
                ) : (
                  <>
                    <span>Execute Check</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Result Display - 8 cols */}
        <div className="col-span-1 md:col-span-8 glass-card rounded-xl p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div
              role="group"
              aria-label="Scoring method"
              className="flex bg-black/40 rounded-lg p-1"
            >
              {["WCAG", "APCA"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m as "WCAG" | "APCA")}
                  aria-pressed={mode === m}
                  className={`focus-ring px-4 py-1.5 rounded-md text-xs font-medium transition-all ${mode === m ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Results swap in asynchronously, so they must be announced rather
               than silently replacing the placeholder. */}
          <div role="status" aria-live="polite" aria-atomic="true">
            {loading.colorCheck && (
              <p className="sr-only">Analyzing contrast…</p>
            )}
            {results ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ColorResult results={results} mode={mode} />
              </div>
            ) : (
              !loading.colorCheck && (
                <div className="flex flex-col items-center justify-center text-muted-foreground py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <svg
                      aria-hidden="true"
                      className="w-8 h-8 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg">Initiate analysis to view results</p>
                </div>
              )
            )}
          </div>

          {error.message && (
            <div
              role="alert"
              className="mt-4 p-4 badge-fail rounded-lg text-sm"
            >
              {error.message}
            </div>
          )}
        </div>

        {/* Preview Card - 6 cols */}
        {results && (
          <div className="col-span-1 md:col-span-6 glass-card rounded-xl p-6 min-h-[300px] flex flex-col">
            <h3 className="text-caption text-muted-foreground uppercase tracking-widest mb-4">
              Live Preview
            </h3>
            <div
              className="flex-1 rounded-2xl p-8 transition-colors duration-500 flex flex-col justify-center relative overflow-hidden shadow-2xl"
              style={{ backgroundColor, color: foregroundColor }}
            >
              <div className="relative z-10">
                <h4 className="text-4xl font-bold mb-4 tracking-tight">
                  The quick brown fox.
                </h4>
                <p className="text-lg opacity-90 font-light leading-relaxed">
                  Jumps over the lazy dog. Accessibility is essential for every
                  digital experience.
                </p>
              </div>
              {/* Texture overlay for preview to show it handles noise well */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Color blindness simulation - 6 cols */}
        {results && (
          <div className="col-span-1 md:col-span-6 glass-card rounded-xl p-6">
            <h3 className="text-caption text-muted-foreground uppercase tracking-widest mb-4">
              Color Vision
            </h3>
            <ColorBlindnessSimulation
              foregroundColor={foregroundColor}
              backgroundColor={backgroundColor}
            />
          </div>
        )}

        {/* Suggestions & Palettes - 6 cols */}
        {results && (
          <div className="col-span-1 md:col-span-6 glass-card rounded-xl p-6 space-y-6">
            <h3 className="text-caption text-muted-foreground uppercase tracking-widest">
              Suggestions
            </h3>
            <ColorPaletteSuggestions
              baseColor={foregroundColor}
              onApplyPalette={handleApplyPalette}
            />
            <div className="pt-4 border-t border-white/5">
              <ColorSuggestions
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                contrastRatio={results.contrast}
                suggestions={results.suggestions || []}
                onApplySuggestion={handleApplyPalette}
                mode={mode}
              />
            </div>
          </div>
        )}

        {/* Full Width Analyzers */}
        <div className="col-span-1 md:col-span-12 space-y-6 pt-12">
          <div className="flex items-center gap-6 mb-8">
            <h2 className="text-h2 tracking-tight text-white">
              Full-Site Analysis
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <WebsiteAnalyzer />
            </div>
            <div className="glass-card rounded-xl p-6">
              <Suspense
                fallback={
                  <div className="animate-pulse h-64 bg-white/5 rounded-2xl" />
                }
              >
                <ImageAnalyzer />
              </Suspense>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <Suspense
              fallback={
                <div className="animate-pulse h-64 bg-white/5 rounded-lg" />
              }
            >
              <SemanticStructureAnalyzer />
            </Suspense>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <KeyboardNavigationChecker />
            </div>
            <div className="glass-card rounded-xl p-6">
              <Suspense
                fallback={
                  <div className="animate-pulse h-64 bg-white/5 rounded-2xl" />
                }
              >
                <FormAccessibilityAnalyzer />
              </Suspense>
            </div>
            <div className="glass-card rounded-xl p-6">
              <Suspense
                fallback={
                  <div className="animate-pulse h-64 bg-white/5 rounded-2xl" />
                }
              >
                <DynamicContentAnalyzer />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Utilities Overlay */}
      <ExportResults
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        contrastRatio={results?.contrast || 0}
        wcagAA={results?.AA || { normal: false, large: false }}
        wcagAAA={results?.AAA || { normal: false, large: false }}
      />

      <SavedColorPalettes
        ref={savedPalettesRef}
        currentForeground={foregroundColor}
        currentBackground={backgroundColor}
        contrastRatio={results?.contrast || 0}
        onApplyPalette={handleApplyPalette}
      />
    </>
  );
}
