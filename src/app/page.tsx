"use client";

import { useRef, useEffect, useCallback } from "react";
import ColorResult from "@/components/ColorResult";
import ColorPicker from "@/components/ColorPicker";
import ColorBlindnessSimulation from "@/components/ColorBlindnessSimulation";
import ColorSuggestions from "@/components/ColorSuggestions";
import SavedColorPalettes from "@/components/SavedColorPalettes";
import WcagInformation from "@/components/WcagInformation";
import AccessibilityTip from "@/components/AccessibilityTip";
import ExportResults from "@/components/ExportResults";
import ColorPaletteSuggestions from "@/components/ColorPaletteSuggestions";
import AccessibilityLearningHub from "@/components/AccessibilityLearningHub";
import KeyboardNavigationChecker from "@/components/KeyboardNavigationChecker";
import SemanticStructureAnalyzer from "@/components/SemanticStructureAnalyzer";
import WebsiteAnalyzer from "@/components/WebsiteAnalyzer";
import useColorContrast from "@/hooks/useColorContrast";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import FontSizeAccessibility from '@/components/FontSizeAccessibility';

// Dynamically import components to avoid SSR issues
const ImageAnalyzer = dynamic(() => import('@/components/ImageAnalyzer'), {
  ssr: false,
  loading: () => (
    <div className="glass-morphism p-8 rounded-2xl animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
});

const FormAccessibilityAnalyzer = dynamic(() => import('@/components/FormAccessibilityAnalyzer'), {
  ssr: false,
  loading: () => (
    <div className="glass-morphism p-8 rounded-2xl animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
});

const DynamicContentAnalyzer = dynamic(() => import('@/components/DynamicContentAnalyzer'), {
  ssr: false,
  loading: () => (
    <div className="glass-morphism p-8 rounded-2xl animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
});

export default function Home() {
  const {
    foregroundColor,
    backgroundColor,
    setForegroundColor,
    setBackgroundColor,
    results,
    loading,
    error,
    checkContrast
  } = useColorContrast();
  
  const savedPalettesRef = useRef<{ setShowSaveDialog: (show: boolean) => void }>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to check contrast
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        checkContrast();
      }
      
      // Ctrl/Cmd + S to save current palette
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && results) {
        e.preventDefault();
        savedPalettesRef.current?.setShowSaveDialog(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, checkContrast]);

  const handleApplyPalette = useCallback((foreground: string, background: string) => {
    setForegroundColor(foreground);
    setBackgroundColor(background);
  }, [setForegroundColor, setBackgroundColor]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Color Analysis Section */}
      <section className="space-y-8">
        <div className="glass-morphism p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
              Color Contrast Checker
            </h2>
            <div className="flex items-center space-x-2">
              <AccessibilityTip title="About Contrast">
                <p>Color contrast is important for text readability. WCAG guidelines require a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.</p>
              </AccessibilityTip>
              
              <AccessibilityTip title="Keyboard Shortcuts">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Ctrl/⌘ + Enter: Check contrast</li>
                  <li>Ctrl/⌘ + S: Save palette</li>
                </ul>
              </AccessibilityTip>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ColorPicker
              label="Text Color"
              color={foregroundColor}
              onChange={setForegroundColor}
            />
            <ColorPicker
              label="Background Color"
              color={backgroundColor}
              onChange={setBackgroundColor}
            />
          </div>

          <div className="mt-8">
            <button
              onClick={checkContrast}
              disabled={loading.colorCheck}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-6 rounded-xl font-medium 
                       hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all 
                       duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              aria-label="Check color contrast"
            >
              {loading.colorCheck ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </span>
              ) : (
                "Check Contrast"
              )}
            </button>
          </div>
        </div>

        {error.type && (
          <div className="glass-morphism border-l-4 border-red-500 p-4 rounded-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-700">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {results && (
          <>
            <ColorResult results={results} />
            
            <ColorPaletteSuggestions
              baseColor={foregroundColor}
              onApplyPalette={handleApplyPalette}
            />
            
            {results.suggestions && results.suggestions.length > 0 && (
              <ColorSuggestions 
                foregroundColor={foregroundColor} 
                backgroundColor={backgroundColor} 
                contrastRatio={results.contrast}
                suggestions={results.suggestions}
                onApplySuggestion={handleApplyPalette}
              />
            )}
            
            <div className="glass-morphism p-8 rounded-2xl">
              <h2 className="text-2xl font-semibold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
                Preview
              </h2>
              <div
                className="p-8 rounded-xl transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: backgroundColor,
                  color: foregroundColor,
                }}
              >
                <p className="text-3xl font-bold mb-4">Sample Text</p>
                <p className="text-lg mb-4">This is how your text will look with the selected colors.</p>
                <p className="text-base">The quick brown fox jumps over the lazy dog.</p>
              </div>
            </div>
            
            <ColorBlindnessSimulation 
              foregroundColor={foregroundColor} 
              backgroundColor={backgroundColor} 
            />
            
            <ExportResults
              foregroundColor={foregroundColor}
              backgroundColor={backgroundColor}
              contrastRatio={results.contrast}
              wcagAA={results.AA}
              wcagAAA={results.AAA}
            />
            
            <SavedColorPalettes
              ref={savedPalettesRef}
              currentForeground={foregroundColor}
              currentBackground={backgroundColor}
              contrastRatio={results.contrast}
              onApplyPalette={handleApplyPalette}
            />
            
            <WcagInformation />
          </>
        )}
      </section>

      {/* Website Analysis Section */}
      <section className="space-y-8">
        <div className="glass-morphism p-8 rounded-2xl">
          <h2 className="text-2xl font-semibold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
            Website Accessibility Analysis
          </h2>
          <div className="grid grid-cols-1 gap-8">
            <WebsiteAnalyzer />
            
            <Suspense fallback={<div>Loading image analyzer...</div>}>
              <ImageAnalyzer />
            </Suspense>

            <Suspense fallback={<div>Loading form analyzer...</div>}>
              <FormAccessibilityAnalyzer />
            </Suspense>

            <Suspense fallback={<div>Loading dynamic content analyzer...</div>}>
              <DynamicContentAnalyzer />
            </Suspense>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
                    Semantic Structure Analyzer
                  </h3>
                  <AccessibilityTip title="About Semantic HTML">
                    <p>Semantic HTML helps assistive technologies understand your content structure.</p>
                    <ul className="list-disc pl-4 mt-2">
                      <li>Use proper heading hierarchy (h1-h6)</li>
                      <li>Include ARIA labels where needed</li>
                      <li>Use semantic elements (nav, main, article, etc.)</li>
                      <li>Ensure form elements have labels</li>
                    </ul>
                  </AccessibilityTip>
                </div>
                <SemanticStructureAnalyzer />
              </div>

              <div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
                    Keyboard Navigation Checker
                  </h3>
                  <AccessibilityTip title="About Keyboard Navigation">
                    <p>Keyboard navigation is essential for users who can't use a mouse.</p>
                    <ul className="list-disc pl-4 mt-2">
                      <li>All interactive elements should be focusable</li>
                      <li>Focus order should be logical</li>
                      <li>Focus indicators should be visible</li>
                      <li>Skip links should be available for main content</li>
                    </ul>
                  </AccessibilityTip>
                </div>
                <KeyboardNavigationChecker />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Resources Section */}
      <section className="space-y-8">
        <div className="glass-morphism p-8 rounded-2xl">
          <h2 className="text-2xl font-semibold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
            Learning Resources
          </h2>
          <div className="grid grid-cols-1 gap-8">
            <AccessibilityLearningHub />
            <FontSizeAccessibility />
          </div>
        </div>
      </section>
    </div>
  );
}
