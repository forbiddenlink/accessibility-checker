import { useState } from 'react';
import type { ImageAnalysisResult } from '@/utils/imageAnalyzer';

export default function ImageAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImageAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/analyze-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to analyze images');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="glass-morphism p-8 rounded-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
          Image Accessibility Analyzer
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
            {loading ? 'Analyzing...' : 'Analyze Images'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg" role="alert">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Summary</h3>
                <div className="space-y-2">
                  <p>Total Images: {results.length}</p>
                  <p>Images with Issues: {results.filter(r => r.issues.length > 0).length}</p>
                  <p>Average Load Time: {
                    Math.round(
                      results.reduce((sum, r) => sum + r.performance.loadTime, 0) / results.length
                    )
                  }ms</p>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Common Issues</h3>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(
                    results.flatMap(r => r.issues)
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

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Detailed Analysis</h3>
              {results.map((image, index) => (
                <div key={index} className="bg-white/5 p-6 rounded-lg space-y-4">
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow space-y-4">
                      <h4 className="font-medium">Image {index + 1}</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Dimensions</p>
                          <p>{image.dimensions.width}x{image.dimensions.height}px</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Load Time</p>
                          <p>{Math.round(image.performance.loadTime)}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-400">File Size</p>
                          <p>{formatFileSize(image.performance.size)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Format</p>
                          <p>{image.performance.format.toUpperCase()}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-gray-400 mb-2">Accessibility</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Alt Text</p>
                            {image.accessibility.isDecorative ? (
                              <p className="italic">Decorative image</p>
                            ) : image.accessibility.altText ? (
                              <p className="break-words">{image.accessibility.altText}</p>
                            ) : (
                              <p className="text-red-500">Missing alt text</p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-400">ARIA Role</p>
                            <p>{image.accessibility.role || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">ARIA Label</p>
                            <p>{image.accessibility.ariaLabel || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Long Description</p>
                            <p>{image.accessibility.longDescription ? 'Present' : 'None'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-gray-400 mb-2">Responsive Design</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Srcset</p>
                            <p>{image.responsive.hasSrcSet ? 'Present' : 'None'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Sizes</p>
                            <p>{image.responsive.hasSizes ? 'Present' : 'None'}</p>
                          </div>
                          {image.responsive.breakpoints && (
                            <div className="col-span-2">
                              <p className="text-gray-400">Breakpoints</p>
                              <p>{image.responsive.breakpoints.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {image.issues.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2 text-white">Issues Found</h5>
                      <div className="space-y-2">
                        {image.issues.map((issue, issueIndex) => (
                          <div
                            key={issueIndex}
                            className={`p-3 rounded-lg border ${
                              issue.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                              issue.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-medium">{issue.code}:</span>
                              <span>{issue.message}</span>
                            </div>
                            {issue.suggestion && (
                              <p className="mt-1 text-sm opacity-80">
                                Suggestion: {issue.suggestion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
