import { useState } from "react";
import type {
  DynamicContentAnalysis,
  DynamicElement,
  LiveRegion,
} from "@/utils/dynamicContentAnalyzer";
import ViolationCard from "@/components/ViolationCard";
import { criterionForCode } from "@/utils/wcagCriteria";

export default function DynamicContentAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DynamicContentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/analyze-dynamic-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to analyze dynamic content");
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

  const renderLiveRegion = (region: LiveRegion) => (
    <div className="p-4 bg-white/5 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Element</p>
          <p className="font-mono text-sm">{region.element}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Role</p>
          <p>{region.role}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Aria-Live</p>
          <p>{region.ariaLive || "Not set"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Atomic</p>
          <p>{region.ariaAtomic ? "Yes" : "No"}</p>
        </div>
        {region.ariaRelevant && (
          <div className="col-span-2">
            <p className="text-muted-foreground">Relevant</p>
            <p>{region.ariaRelevant.join(", ")}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDynamicElement = (element: DynamicElement) => (
    <div className="p-4 bg-white/5 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Type</p>
          <p className="capitalize">{element.type}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Role</p>
          <p>{element.role}</p>
        </div>
        <div>
          <p className="text-muted-foreground">ARIA Controls</p>
          <p>{element.hasAriaControls ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">ARIA Expanded</p>
          <p>{element.hasAriaExpanded ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">ARIA Hidden</p>
          <p>{element.hasAriaHidden ? "Yes" : "No"}</p>
        </div>
        {element.hasAriaModal !== undefined && (
          <div>
            <p className="text-muted-foreground">ARIA Modal</p>
            <p>{element.hasAriaModal ? "Yes" : "No"}</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-muted-foreground mb-2">Focus Management</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Traps Focus</p>
            <p>{element.focusManagement.trapsFocus ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Restores Focus</p>
            <p>{element.focusManagement.restoresFocus ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Keyboard Navigation</p>
            <p>{element.focusManagement.hasKeyboardNav ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Escape Key</p>
            <p>{element.escapeKey ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="glass-morphism p-8 rounded-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-white">
          Dynamic Content Analyzer
        </h2>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL"
            className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Website URL"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url}
            className="focus-ring px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Dynamic Content"}
          </button>
        </div>

        {error && (
          <div className="p-4 badge-fail rounded-lg" role="alert">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-white">Summary</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Live Regions: {results.liveRegions.length}</p>
                  <p>Dynamic Elements: {results.dynamicElements.length}</p>
                  <p>Issues Found: {results.issues.length}</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-white">
                  Common Issues
                </h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {Object.entries(
                    results.issues.reduce<Record<string, number>>(
                      (acc, issue) => {
                        acc[issue.code] = (acc[issue.code] || 0) + 1;
                        return acc;
                      },
                      {},
                    ),
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([code, count]) => (
                      <li key={code}>
                        {code}: {count} occurrence{count !== 1 ? "s" : ""}
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {results.liveRegions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                  Live Regions
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {results.liveRegions.map((region, index) => (
                    <div key={index}>{renderLiveRegion(region)}</div>
                  ))}
                </div>
              </div>
            )}

            {results.dynamicElements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                  Dynamic Elements
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {results.dynamicElements.map((element, index) => (
                    <div key={index}>{renderDynamicElement(element)}</div>
                  ))}
                </div>
              </div>
            )}

            {results.issues.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                  Accessibility Issues
                </h3>
                <div className="space-y-2">
                  {results.issues.map((issue, index) => (
                    <ViolationCard
                      key={index}
                      code={issue.code}
                      severity={issue.type}
                      message={issue.message}
                      fix={issue.suggestion}
                      element={issue.element}
                      criterion={criterionForCode(issue.code)}
                    />
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
