"use client";

import { useState } from "react";
import type { WebsiteAnalysisResult } from "@/utils/websiteAnalyzer";

export default function WebsiteAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WebsiteAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/analyze-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to analyze website");
      }

      setResults(data.results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during analysis",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-h3 text-white">Website Analyzer</h2>

      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-accent/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition duration-300 blur" />
          <input
            type="url"
            id="website-url"
            aria-label="Website URL to analyze"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL"
            className="relative w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !url}
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 transition-all"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <div className="p-4 badge-fail rounded-lg">{error}</div>}

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
            <h3 className="text-xl font-semibold mb-4 text-white">
              Page Analysis
            </h3>
            {results.pages.map((page, index) => (
              <div key={index} className="bg-white/5 p-6 rounded-lg space-y-4">
                <h4 className="font-medium text-white">{page.path || "/"}</h4>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Load Time</p>
                    <p className="text-white">{Math.round(page.loadTime)}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Resources</p>
                    <p className="text-white">
                      {page.resources.images} images, {page.resources.scripts}{" "}
                      scripts, {page.resources.stylesheets} stylesheets
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2 text-white">
                    Accessibility Issues
                  </h5>
                  <div className="space-y-2">
                    {page.accessibility.violations.map((violation, vIndex) => (
                      <div
                        key={vIndex}
                        className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-medium">{violation.id}:</span>
                          <span>{violation.description}</span>
                        </div>
                        {violation.nodes.length > 0 && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium text-red-300">
                              Affected Elements:
                            </p>
                            <ul className="list-disc list-inside text-red-300/80">
                              {violation.nodes.map((node, nIndex) => (
                                <li
                                  key={nIndex}
                                  className="font-mono text-xs mt-1"
                                >
                                  {node}
                                </li>
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
  );
}
