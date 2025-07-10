'use client';

import React, { useState } from 'react';
import { WebsiteAnalyzer as WebsiteAnalyzerUtil } from '@/utils/websiteAnalyzer';
import type { WebsiteAnalysisResult } from '@/utils/websiteAnalyzer';

export default function WebsiteAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WebsiteAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-morphism p-8 rounded-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
          Website Accessibility Analyzer
        </h2>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Website'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Summary</h3>
                <div className="space-y-2">
                  <p>Pages Analyzed: {results.pages.length}</p>
                  <p>Total Violations: {results.totalViolations}</p>
                  <p>Total Passes: {results.totalPasses}</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Common Issues</h3>
                <ul className="list-disc list-inside space-y-1">
                  {results.commonIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Page Analysis</h3>
              {results.pages.map((page, index) => (
                <div key={index} className="bg-white/5 p-6 rounded-lg space-y-4">
                  <h4 className="font-medium">{page.path || '/'}</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Load Time</p>
                      <p>{Math.round(page.loadTime)}ms</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Resources</p>
                      <p>
                        {page.resources.images} images, {page.resources.scripts} scripts,{' '}
                        {page.resources.stylesheets} stylesheets
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Accessibility Issues</h5>
                    <div className="space-y-2">
                      {page.accessibility.violations.map((violation, vIndex) => (
                        <div
                          key={vIndex}
                          className="p-3 bg-red-50 text-red-700 rounded-lg"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-medium">{violation.id}:</span>
                            <span>{violation.description}</span>
                          </div>
                          {violation.nodes.length > 0 && (
                            <div className="mt-2 text-sm">
                              <p className="font-medium">Affected Elements:</p>
                              <ul className="list-disc list-inside">
                                {violation.nodes.map((node, nIndex) => (
                                  <li key={nIndex}>{node}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 