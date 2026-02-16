import { useState } from 'react';
import type { FormAnalysisResult, FormField, FormIssue } from '@/utils/formAnalyzer';

export default function FormAccessibilityAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FormAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/analyze-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to analyze forms');
      }

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
          Form Accessibility Analyzer
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
            {loading ? 'Analyzing...' : 'Analyze Forms'}
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
                  <p>Total Forms: {results.length}</p>
                  <p>Forms with Issues: {results.filter(r => r.issues.length > 0).length}</p>
                  <p>Total Issues: {results.reduce((sum, r) => sum + r.issues.length, 0)}</p>
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
              {results.map((form, index) => (
                <div key={index} className="bg-white/5 p-6 rounded-lg space-y-4">
                  <h4 className="font-medium">Form {index + 1}</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Form Role</p>
                      <p>{form.role || 'form'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Form Name</p>
                      <p>{form.name || 'Unnamed Form'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Input Fields</p>
                      <p>{form.fields.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Submit Method</p>
                      <p>{form.method.toUpperCase()}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Form Fields</h5>
                    <div className="space-y-2">
                      {form.fields.map((field: FormField, fieldIndex: number) => (
                        <div key={fieldIndex} className="p-3 bg-white/5 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-400">Field Type</p>
                              <p>{field.type}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Label Present</p>
                              <p>{field.hasLabel ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Required</p>
                              <p>{field.required ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">ARIA Labels</p>
                              <p>{field.ariaLabels ? 'Present' : 'None'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {form.issues.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2 text-white">Issues Found</h5>
                      <div className="space-y-2">
                        {form.issues.map((issue: FormIssue, issueIndex: number) => (
                          <div
                            key={issueIndex}
                            className={`p-3 rounded-lg border ${
                              issue.severity === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                              issue.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
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
