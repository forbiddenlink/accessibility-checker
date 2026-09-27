import { useState } from "react";
import type {
  FormAnalysisResult,
  FormField,
  FormIssue,
} from "@/utils/formAnalyzer";
import ViolationCard from "@/components/ViolationCard";
import { criterionForCode } from "@/utils/wcagCriteria";

export default function FormAccessibilityAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FormAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/analyze-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to analyze forms");
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
    <div className="glass-morphism p-8 rounded-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-white">
          Form Accessibility Analyzer
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
            {loading ? "Analyzing..." : "Analyze Forms"}
          </button>
        </div>

        {error && (
          <div className="p-4 badge-fail rounded-lg" role="alert">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-white">Summary</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Total Forms: {results.length}</p>
                  <p>
                    Forms with Issues:{" "}
                    {results.filter((r) => r.issues.length > 0).length}
                  </p>
                  <p>
                    Total Issues:{" "}
                    {results.reduce((sum, r) => sum + r.issues.length, 0)}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-white">
                  Common Issues
                </h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {Object.entries(
                    results
                      .flatMap((r) => r.issues)
                      .reduce<Record<string, number>>((acc, issue) => {
                        acc[issue.code] = (acc[issue.code] || 0) + 1;
                        return acc;
                      }, {}),
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

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">
                Detailed Analysis
              </h3>
              {results.map((form, index) => (
                <div
                  key={index}
                  className="bg-white/5 p-6 rounded-lg space-y-4"
                >
                  <h4 className="font-medium text-white">Form {index + 1}</h4>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Form Role</p>
                      <p className="text-white">{form.role || "form"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Form Name</p>
                      <p className="text-white">
                        {form.name || "Unnamed Form"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Input Fields</p>
                      <p className="text-white">{form.fields.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submit Method</p>
                      <p className="text-white">{form.method.toUpperCase()}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-white">Form Fields</h5>
                    <div className="space-y-2">
                      {form.fields.map(
                        (field: FormField, fieldIndex: number) => (
                          <div
                            key={fieldIndex}
                            className="p-3 bg-white/5 rounded-lg"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-muted-foreground">
                                  Field Type
                                </p>
                                <p className="text-white">{field.type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Label Present
                                </p>
                                <p className="text-white">
                                  {field.hasLabel ? "Yes" : "No"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Required
                                </p>
                                <p className="text-white">
                                  {field.required ? "Yes" : "No"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  ARIA Labels
                                </p>
                                <p className="text-white">
                                  {field.ariaLabels ? "Present" : "None"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {form.issues.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2 text-white">
                        Issues Found
                      </h5>
                      <div className="space-y-2">
                        {form.issues.map(
                          (issue: FormIssue, issueIndex: number) => (
                            <ViolationCard
                              key={issueIndex}
                              code={issue.code}
                              severity={issue.severity}
                              message={issue.message}
                              fix={issue.suggestion}
                              criterion={criterionForCode(issue.code)}
                            />
                          ),
                        )}
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
