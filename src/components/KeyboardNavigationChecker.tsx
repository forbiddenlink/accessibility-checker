import { useState } from "react";
import type {
  FocusableElement,
  NavigationIssue,
} from "@/utils/keyboardNavigationAnalyzer";
import ViolationCard from "@/components/ViolationCard";
import { criterionForKeyboardMessage } from "@/utils/wcagCriteria";

export default function KeyboardNavigationChecker() {
  const [url, setUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [focusableElements, setFocusableElements] = useState<
    FocusableElement[]
  >([]);
  const [issues, setIssues] = useState<NavigationIssue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkKeyboardNavigation = async () => {
    try {
      setIsChecking(true);
      setError(null);
      setFocusableElements([]);
      setIssues([]);

      const response = await fetch("/api/analyze-keyboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to analyze keyboard navigation");
      }

      setFocusableElements(data.results.focusableElements ?? []);
      setIssues(data.results.issues ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze keyboard navigation",
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-h3 text-white">Keyboard Navigation</h2>

      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-accent/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition duration-300 blur" />
          <input
            type="url"
            id="keyboard-nav-url"
            aria-label="Website URL for keyboard navigation check"
            placeholder="Enter website URL to check"
            className="relative w-full p-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-accent transition-all backdrop-blur-xl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <button
          onClick={checkKeyboardNavigation}
          disabled={isChecking || !url}
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg disabled:opacity-50 hover:bg-white/90 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {isChecking ? "Checking..." : "Check"}
        </button>
      </div>

      {error && (
        <div className="p-4 badge-fail rounded-lg" role="alert">
          {error}
        </div>
      )}

      {focusableElements.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-lg border border-white/8">
            <h3 className="text-h3 text-white mb-4">Focusable Elements</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {focusableElements.map((el, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-body-sm text-indigo-300 bg-accent/10 px-2 py-0.5 rounded">
                      &lt;{el.tagName}&gt;
                    </span>
                    <span
                      className={`px-2 py-1 rounded-md text-caption font-medium ${
                        el.hasVisibleFocus ? "badge-pass" : "badge-fail"
                      }`}
                    >
                      {el.hasVisibleFocus ? "Visible Focus" : "No Focus Style"}
                    </span>
                  </div>
                  {el.ariaLabel && (
                    <p className="text-body-sm text-muted-foreground truncate">
                      aria-label:{" "}
                      <span className="text-foreground/80">{el.ariaLabel}</span>
                    </p>
                  )}
                  {el.text && (
                    <p className="text-body-sm text-muted-foreground truncate">
                      Text:{" "}
                      <span className="text-foreground/80">{el.text}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-lg border border-white/8">
            <h3 className="text-h3 text-white mb-4">Issues Found</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {issues.map((issue, index) => (
                <ViolationCard
                  key={index}
                  code={
                    issue.type === "error"
                      ? "keyboard-error"
                      : "keyboard-warning"
                  }
                  severity={issue.type}
                  message={issue.message}
                  fix={issue.suggestion}
                  element={issue.element}
                  criterion={criterionForKeyboardMessage(issue.message)}
                />
              ))}
              {issues.length === 0 && (
                <div className="p-4 rounded-lg badge-pass border-l-4 border-success">
                  No keyboard navigation issues detected.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
