import { useState } from 'react';
import type { DynamicContentAnalysis, DynamicElement, LiveRegion } from '@/utils/dynamicContentAnalyzer';

export default function DynamicContentAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DynamicContentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/analyze-dynamic-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze dynamic content');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const renderLiveRegion = (region: LiveRegion) => (
    <div className="p-4 bg-white/5 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Element</p>
          <p className="font-mono text-sm">{region.element}</p>
        </div>
        <div>
          <p className="text-gray-400">Role</p>
          <p>{region.role}</p>
        </div>
        <div>
          <p className="text-gray-400">Aria-Live</p>
          <p>{region.ariaLive || 'Not set'}</p>
        </div>
        <div>
          <p className="text-gray-400">Atomic</p>
          <p>{region.ariaAtomic ? 'Yes' : 'No'}</p>
        </div>
        {region.ariaRelevant && (
          <div className="col-span-2">
            <p className="text-gray-400">Relevant</p>
            <p>{region.ariaRelevant.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDynamicElement = (element: DynamicElement) => (
    <div className="p-4 bg-white/5 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Type</p>
          <p className="capitalize">{element.type}</p>
        </div>
        <div>
          <p className="text-gray-400">Role</p>
          <p>{element.role}</p>
        </div>
        <div>
          <p className="text-gray-400">ARIA Controls</p>
          <p>{element.hasAriaControls ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <p className="text-gray-400">ARIA Expanded</p>
          <p>{element.hasAriaExpanded ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <p className="text-gray-400">ARIA Hidden</p>
          <p>{element.hasAriaHidden ? 'Yes' : 'No'}</p>
        </div>
        {element.hasAriaModal !== undefined && (
          <div>
            <p className="text-gray-400">ARIA Modal</p>
            <p>{element.hasAriaModal ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-gray-400 mb-2">Focus Management</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Traps Focus</p>
            <p>{element.focusManagement.trapsFocus ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-gray-400">Restores Focus</p>
            <p>{element.focusManagement.restoresFocus ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-gray-400">Keyboard Navigation</p>
            <p>{element.focusManagement.hasKeyboardNav ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-gray-400">Escape Key</p>
            <p>{element.escapeKey ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="glass-morphism p-8 rounded-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
          Dynamic Content Analyzer
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
            aria-label="Website URL"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Dynamic Content'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg" role="alert">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Summary</h3>
                <div className="space-y-2">
                  <p>Live Regions: {results.liveRegions.length}</p>
                  <p>Dynamic Elements: {results.dynamicElements.length}</p>
                  <p>Issues Found: {results.issues.length}</p>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Common Issues</h3>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(
                    results.issues
                      .reduce<Record<string, number>>((acc, issue) => {
                        acc[issue.code] = (acc[issue.code] || 0) + 1;
                        return acc;
                      }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([code, count]) => (
                      <li key={code}>{code}: {count} occurrence{count !== 1 ? 's' : ''}</li>
                    ))
                  }
                </ul>
              </div>
            </div>

            {results.liveRegions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Live Regions</h3>
                <div className="grid grid-cols-1 gap-4">
                  {results.liveRegions.map((region, index) => (
                    <div key={index}>
                      {renderLiveRegion(region)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.dynamicElements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Dynamic Elements</h3>
                <div className="grid grid-cols-1 gap-4">
                  {results.dynamicElements.map((element, index) => (
                    <div key={index}>
                      {renderDynamicElement(element)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.issues.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Accessibility Issues</h3>
                <div className="space-y-2">
                  {results.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        issue.type === 'error' ? 'bg-red-50 text-red-700' :
                        issue.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-medium">{issue.code}:</span>
                        <span>{issue.message}</span>
                      </div>
                      <p className="mt-2 font-mono text-sm">{issue.element}</p>
                      {issue.suggestion && (
                        <p className="mt-1 text-sm">
                          Suggestion: {issue.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 