import React, { useState, useRef } from "react";

interface SemanticElement {
  tagName: string;
  role?: string;
  ariaAttributes: Record<string, string>;
  children: SemanticElement[];
  level?: number; // For headings
  text?: string;
  hasLabel?: boolean;
}

interface SemanticIssue {
  type: "error" | "warning" | "info";
  message: string;
  element?: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export default function SemanticStructureAnalyzer() {
  const [htmlInput, setHtmlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [structure, setStructure] = useState<SemanticElement[]>([]);
  const [issues, setIssues] = useState<SemanticIssue[]>([]);
  const parserDiv = useRef<HTMLDivElement>(null);

  const analyzeSemanticStructure = () => {
    setIsAnalyzing(true);
    const newIssues: SemanticIssue[] = [];
    const elements: SemanticElement[] = [];

    try {
      // Parse HTML input
      if (parserDiv.current) {
        parserDiv.current.innerHTML = htmlInput;
        const parsedElements = parseElement(parserDiv.current);
        elements.push(...parsedElements);

        // Analyze structure
        analyzeHeadingStructure(elements, newIssues);
        analyzeARIAUsage(elements, newIssues);
        analyzeLandmarks(elements, newIssues);
        analyzeFormElements(elements, newIssues);
        analyzeInteractiveElements(elements, newIssues);

        setStructure(elements);
        setIssues(newIssues);
      }
    } catch (error) {
      setIssues([
        {
          type: "error",
          message: "Error analyzing HTML structure",
          suggestion: "Please check your HTML input for syntax errors",
          priority: "high",
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseElement = (element: Element): SemanticElement[] => {
    const elements: SemanticElement[] = [];

    Array.from(element.children).forEach((child) => {
      const semanticEl: SemanticElement = {
        tagName: child.tagName.toLowerCase(),
        role: child.getAttribute("role") || undefined,
        ariaAttributes: getAriaAttributes(child),
        children: parseElement(child),
        text: child.textContent?.trim(),
        hasLabel: hasAccessibleLabel(child),
      };

      // Add heading level if applicable
      if (semanticEl.tagName.match(/^h[1-6]$/)) {
        semanticEl.level = parseInt(semanticEl.tagName[1]);
      }

      elements.push(semanticEl);
    });

    return elements;
  };

  const getAriaAttributes = (element: Element): Record<string, string> => {
    const ariaAttrs: Record<string, string> = {};
    const attrs = element.attributes;

    for (let i = 0; i < attrs.length; i++) {
      if (attrs[i].name.startsWith("aria-")) {
        ariaAttrs[attrs[i].name] = attrs[i].value;
      }
    }

    return ariaAttrs;
  };

  const hasAccessibleLabel = (element: Element): boolean => {
    return !!(
      element.getAttribute("aria-label") ||
      element.getAttribute("aria-labelledby") ||
      element.getAttribute("title") ||
      element.getAttribute("alt") ||
      (element instanceof HTMLLabelElement && element.htmlFor) ||
      element.textContent?.trim()
    );
  };

  const analyzeHeadingStructure = (
    elements: SemanticElement[],
    issues: SemanticIssue[],
  ) => {
    let lastLevel = 0;
    const findHeadings = (els: SemanticElement[]) => {
      els.forEach((el) => {
        if (el.level) {
          if (el.level - lastLevel > 1) {
            issues.push({
              type: "error",
              message: `Heading level skipped from h${lastLevel} to h${el.level}`,
              element: `<${el.tagName}>${el.text}</${el.tagName}>`,
              suggestion: "Maintain sequential heading hierarchy",
              priority: "high",
            });
          }
          lastLevel = el.level;
        }
        if (el.children.length) findHeadings(el.children);
      });
    };
    findHeadings(elements);
  };

  const analyzeARIAUsage = (
    elements: SemanticElement[],
    issues: SemanticIssue[],
  ) => {
    const checkARIA = (el: SemanticElement) => {
      // Check for common ARIA mistakes
      if (el.role === "button" && el.tagName !== "button") {
        issues.push({
          type: "warning",
          message: `Element with role="button" is not a <button>`,
          element: `<${el.tagName} role="button">`,
          suggestion: 'Use native <button> element instead of role="button"',
          priority: "medium",
        });
      }

      // Check for required ARIA attributes
      if (el.role === "combobox" && !el.ariaAttributes["aria-expanded"]) {
        issues.push({
          type: "error",
          message: "Combobox missing required aria-expanded attribute",
          element: `<${el.tagName} role="combobox">`,
          suggestion: "Add aria-expanded attribute to combobox",
          priority: "high",
        });
      }

      el.children.forEach(checkARIA);
    };
    elements.forEach(checkARIA);
  };

  const analyzeLandmarks = (
    elements: SemanticElement[],
    issues: SemanticIssue[],
  ) => {
    const hasMain = elements.some(
      (el) => el.role === "main" || el.tagName === "main",
    );
    const hasNav = elements.some(
      (el) => el.role === "navigation" || el.tagName === "nav",
    );

    if (!hasMain) {
      issues.push({
        type: "warning",
        message: "No main landmark found",
        suggestion:
          'Add <main> element or role="main" to identify main content',
        priority: "medium",
      });
    }

    if (!hasNav) {
      issues.push({
        type: "info",
        message: "No navigation landmark found",
        suggestion: "Consider adding <nav> element for navigation sections",
        priority: "low",
      });
    }
  };

  const analyzeFormElements = (
    elements: SemanticElement[],
    issues: SemanticIssue[],
  ) => {
    const checkForms = (el: SemanticElement) => {
      if (el.tagName === "input" && !el.hasLabel) {
        issues.push({
          type: "error",
          message: "Input element without label",
          element: `<input>`,
          suggestion: "Add label element or aria-label attribute",
          priority: "high",
        });
      }
      el.children.forEach(checkForms);
    };
    elements.forEach(checkForms);
  };

  const analyzeInteractiveElements = (
    elements: SemanticElement[],
    issues: SemanticIssue[],
  ) => {
    const checkInteractive = (el: SemanticElement) => {
      if (
        ["button", "a", "input", "select"].includes(el.tagName) &&
        !el.hasLabel
      ) {
        issues.push({
          type: "error",
          message: `Interactive element (${el.tagName}) without accessible name`,
          element: `<${el.tagName}>`,
          suggestion: "Add text content, aria-label, or aria-labelledby",
          priority: "high",
        });
      }
      el.children.forEach(checkInteractive);
    };
    elements.forEach(checkInteractive);
  };

  return (
    <div className="space-y-6">
      {/* Hidden parser div */}
      <div ref={parserDiv} className="hidden" />

      {/* Input Section */}
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 group-hover:opacity-100 transition duration-500 blur"></div>
          <textarea
            id="html-input"
            aria-label="HTML code to analyze"
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            placeholder="<!-- Paste your HTML here to analyze structure -->"
            className="relative w-full h-48 p-4 rounded-lg bg-[#0d1117] border border-white/10 text-gray-300 font-mono text-sm resize-y focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
            spellCheck="false"
          />
        </div>
        <button
          onClick={analyzeSemanticStructure}
          disabled={isAnalyzing || !htmlInput.trim()}
          className="w-full px-4 py-3 bg-white text-black font-semibold rounded-lg disabled:opacity-50
                   hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
        >
          {isAnalyzing ? (
            <span>Running Analysis...</span>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>Analyze Structure</span>
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {structure.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Structure Tree - Code Editor Style */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                structure.html
              </span>
            </div>
            <div className="p-4 overflow-x-auto max-h-[500px] custom-scrollbar">
              <div className="space-y-1 font-mono text-sm">
                {renderStructureTree(structure)}
              </div>
            </div>
          </div>

          {/* Issues List - Console Style */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                Console Output
              </span>
              {issues.length > 0 && (
                <div className="flex space-x-3 text-xs">
                  <span className="text-red-400">
                    {issues.filter((i) => i.type === "error").length} Errors
                  </span>
                  <span className="text-yellow-400">
                    {issues.filter((i) => i.type === "warning").length} Warnings
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
              {issues.length === 0 ? (
                <div className="text-green-400 font-mono text-sm">
                  <span className="text-green-500 opacity-50">➜</span> No
                  semantic issues found. Good job!
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue, index) => (
                    <div key={index} className="font-mono text-sm group">
                      <div className="flex items-start space-x-2">
                        <span
                          className={`mt-0.5 shrink-0 ${
                            issue.type === "error"
                              ? "text-red-500"
                              : issue.type === "warning"
                                ? "text-yellow-500"
                                : "text-blue-500"
                          }`}
                        >
                          {issue.type === "error"
                            ? "✖"
                            : issue.type === "warning"
                              ? "⚠"
                              : "ℹ"}
                        </span>
                        <div className="space-y-1">
                          <p
                            className={`font-medium ${
                              issue.type === "error"
                                ? "text-red-400"
                                : issue.type === "warning"
                                  ? "text-yellow-400"
                                  : "text-blue-400"
                            }`}
                          >
                            {issue.message}
                          </p>
                          <div className="pl-4 border-l-2 border-white/10 ml-1 space-y-1">
                            {issue.element && (
                              <div className="text-gray-500 text-xs break-all">
                                Source:{" "}
                                <span className="text-gray-400 font-mono bg-white/5 px-1 rounded">
                                  {issue.element}
                                </span>
                              </div>
                            )}
                            <p className="text-gray-400 text-xs">
                              <span className="text-blue-400 opacity-70">
                                Hint:
                              </span>{" "}
                              {issue.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderStructureTree(
  elements: SemanticElement[],
  depth = 0,
): JSX.Element[] {
  return elements.map((el, index) => (
    <div
      key={index}
      style={{ paddingLeft: `${depth * 20}px` }}
      className="hover:bg-white/5 rounded transition-colors duration-150"
    >
      <div className="flex items-center flex-wrap">
        <span className="text-blue-400 opacity-80">&lt;</span>
        <span className="text-blue-400 font-semibold">{el.tagName}</span>
        {el.role && (
          <span className="text-purple-400 ml-2 italic">
            role=&quot;{el.role}&quot;
          </span>
        )}
        {Object.entries(el.ariaAttributes).map(([key, value]) => (
          <span
            key={key}
            className="text-green-400 ml-2"
          >{`${key}="${value}"`}</span>
        ))}
        <span className="text-blue-400 opacity-80">&gt;</span>

        {/* Inline text preview if it's short */}
        {el.text && !el.children.length && (
          <span className="text-gray-500 ml-2 truncate max-w-[200px]">
            {el.text}
          </span>
        )}

        {/* If no children and has text, close inline */}
        {!el.children.length && (
          <span className="text-blue-400 opacity-80 ml-1">
            &lt;/{el.tagName}&gt;
          </span>
        )}
      </div>

      {el.children.length > 0 && (
        <>
          {renderStructureTree(el.children, depth + 1)}
          <div
            style={{ paddingLeft: `${depth * 20}px` }}
            className="text-blue-400 opacity-60"
          >
            &lt;/{el.tagName}&gt;
          </div>
        </>
      )}
    </div>
  ));
}
