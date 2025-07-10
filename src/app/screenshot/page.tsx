"use client";

import { useState } from 'react';

export default function ScreenshotDemo() {
  const [foregroundColor, setForegroundColor] = useState("#1A365D");
  const [backgroundColor, setBackgroundColor] = useState("#EDF2F7");
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass-morphism p-8 rounded-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
            Check Color Contrast
          </h2>
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs cursor-help">
              ?
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Text Color
            </label>
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-lg shadow-inner border border-slate-200"
                style={{ backgroundColor: foregroundColor }}
              />
              <input
                type="text"
                value={foregroundColor}
                onChange={(e) => setForegroundColor(e.target.value)}
                className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Background Color
            </label>
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-lg shadow-inner border border-slate-200"
                style={{ backgroundColor: backgroundColor }}
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-6 rounded-xl font-medium 
                     hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] 
                     active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            Check Contrast
          </button>
        </div>
      </div>

      <div className="glass-morphism p-8 rounded-2xl">
        <h2 className="text-2xl font-semibold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
          Results
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mr-3">AA</span>
              WCAG 2.1 Level AA
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-2 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  ✓
                </span>
                <span>Normal text (4.5:1)</span>
              </div>
              <div className="flex items-center">
                <span className="w-5 h-5 mr-2 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  ✓
                </span>
                <span>Large text (3:1)</span>
              </div>
            </div>
          </div>

          <div className="bg-white/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm mr-3">AAA</span>
              WCAG 2.1 Level AAA
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-2 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  ✓
                </span>
                <span>Normal text (7:1)</span>
              </div>
              <div className="flex items-center">
                <span className="w-5 h-5 mr-2 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  ✓
                </span>
                <span>Large text (4.5:1)</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-8 rounded-xl transition-all duration-300 shadow-lg mb-8"
          style={{
            backgroundColor: backgroundColor,
            color: foregroundColor,
          }}
        >
          <p className="text-3xl font-bold mb-4">Sample Text</p>
          <p className="text-lg mb-4">This is how your text will look with the selected colors.</p>
          <p className="text-base">The quick brown fox jumps over the lazy dog.</p>
        </div>

        <div className="flex justify-end space-x-4">
          <button className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
            Save Palette
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Export Results
          </button>
        </div>
      </div>
    </div>
  );
} 