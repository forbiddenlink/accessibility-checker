"use client";

import { useState } from "react";
import type { WebsiteAnalysisResult } from "@/utils/websiteAnalyzer";
import ViolationCard, {
  type NormalizedSeverity,
} from "@/components/ViolationCard";
import { criterionForCode } from "@/utils/wcagCriteria";

// axe-core returns violations in rule-registration order, not by severity.
// Established checkers (axe DevTools, WAVE) lead with what matters most, so
// sort critical first and put anything unrecognized last rather than
// dropping it.
const IMPACT_ORDER: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

const IMPACT_TO_SEVERITY: Record<string, NormalizedSeverity> = {
  critical: "critical",
  serious: "serious",
  moderate: "moderate",
  minor: "minor",
};

function byImpact<T extends { impact?: string | null }>(violations: T[]): T[] {
  return [...violations].sort(
    (a, b) =>
      (IMPACT_ORDER[a.impact ?? ""] ?? 99) -
      (IMPACT_ORDER[b.impact ?? ""] ?? 99),
  );
}

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
        const reason = data?.failedPages?.[0]?.reason;
        const message = data?.error || "Failed to analyze website";
        throw new Error(reason ? `${message} (${reason})` : message);
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

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 group">
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-accent/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition duration-300 blur" />
          <input
            type="url"
            id="website-url"
            aria-label="Website URL to analyze"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "website-url-error" : undefined}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="focus-ring relative w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-white placeholder-white/30 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !url}
          aria-busy={loading}
          className="focus-ring px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 disabled:opacity-50 transition-all"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && (
        <div
          id="website-url-error"
          role="alert"
          className="p-4 badge-fail rounded-lg"
        >
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-8">
          {results.failedPages?.length > 0 && (
            <div role="alert" className="p-4 badge-fail rounded-lg">
              <p className="font-medium">
                {results.failedPages.length}{" "}
                {results.failedPages.length === 1 ? "page" : "pages"} could not
                be analyzed and{" "}
                {results.failedPages.length === 1 ? "is" : "are"} not counted as
                clean:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                {results.failedPages.map((failed) => (
                  <li key={failed.url}>
                    {failed.url}: {failed.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 text-white">Summary</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>Pages Analyzed: {results.pages.length}</p>
                <p>Total Violations: {results.totalViolations}</p>
                <p>Total Passes: {results.totalPasses}</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 text-white">
                Common Issues
              </h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
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
                    <p className="text-muted-foreground">Load Time</p>
                    <p className="text-white">{Math.round(page.loadTime)}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Resources</p>
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
                    {byImpact(page.accessibility.violations).map(
                      (violation, vIndex) => (
                        <ViolationCard
                          key={vIndex}
                          code={violation.id}
                          severity={
                            IMPACT_TO_SEVERITY[violation.impact ?? ""] ??
                            "minor"
                          }
                          message={violation.description}
                          fix={violation.help}
                          element={violation.nodes[0]}
                          criterion={criterionForCode(violation.id)}
                        />
                      ),
                    )}
                    {page.accessibility.violations.length === 0 && (
                      <div className="p-4 rounded-lg badge-pass border-l-4 border-success">
                        No accessibility violations detected on this page.
                      </div>
                    )}
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
