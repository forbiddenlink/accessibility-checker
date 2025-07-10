import React, { useState, useRef } from 'react';

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
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export default function SemanticStructureAnalyzer() {
  const [htmlInput, setHtmlInput] = useState('');
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
      setIssues([{
        type: 'error',
        message: 'Error analyzing HTML structure',
        suggestion: 'Please check your HTML input for syntax errors',
        priority: 'high'
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseElement = (element: Element): SemanticElement[] => {
    const elements: SemanticElement[] = [];
    
    Array.from(element.children).forEach(child => {
      const semanticEl: SemanticElement = {
        tagName: child.tagName.toLowerCase(),
        role: child.getAttribute('role') || undefined,
        ariaAttributes: getAriaAttributes(child),
        children: parseElement(child),
        text: child.textContent?.trim(),
        hasLabel: hasAccessibleLabel(child)
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
      if (attrs[i].name.startsWith('aria-')) {
        ariaAttrs[attrs[i].name] = attrs[i].value;
      }
    }
    
    return ariaAttrs;
  };

  const hasAccessibleLabel = (element: Element): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      element.getAttribute('alt') ||
      (element instanceof HTMLLabelElement && element.htmlFor) ||
      element.textContent?.trim()
    );
  };

  const analyzeHeadingStructure = (elements: SemanticElement[], issues: SemanticIssue[]) => {
    let lastLevel = 0;
    const findHeadings = (els: SemanticElement[]) => {
      els.forEach(el => {
        if (el.level) {
          if (el.level - lastLevel > 1) {
            issues.push({
              type: 'error',
              message: `Heading level skipped from h${lastLevel} to h${el.level}`,
              element: `<${el.tagName}>${el.text}</${el.tagName}>`,
              suggestion: 'Maintain sequential heading hierarchy',
              priority: 'high'
            });
          }
          lastLevel = el.level;
        }
        if (el.children.length) findHeadings(el.children);
      });
    };
    findHeadings(elements);
  };

  const analyzeARIAUsage = (elements: SemanticElement[], issues: SemanticIssue[]) => {
    const checkARIA = (el: SemanticElement) => {
      // Check for common ARIA mistakes
      if (el.role === 'button' && el.tagName !== 'button') {
        issues.push({
          type: 'warning',
          message: `Element with role="button" is not a <button>`,
          element: `<${el.tagName} role="button">`,
          suggestion: 'Use native <button> element instead of role="button"',
          priority: 'medium'
        });
      }

      // Check for required ARIA attributes
      if (el.role === 'combobox' && !el.ariaAttributes['aria-expanded']) {
        issues.push({
          type: 'error',
          message: 'Combobox missing required aria-expanded attribute',
          element: `<${el.tagName} role="combobox">`,
          suggestion: 'Add aria-expanded attribute to combobox',
          priority: 'high'
        });
      }

      el.children.forEach(checkARIA);
    };
    elements.forEach(checkARIA);
  };

  const analyzeLandmarks = (elements: SemanticElement[], issues: SemanticIssue[]) => {
    const hasMain = elements.some(el => el.role === 'main' || el.tagName === 'main');
    const hasNav = elements.some(el => el.role === 'navigation' || el.tagName === 'nav');
    
    if (!hasMain) {
      issues.push({
        type: 'warning',
        message: 'No main landmark found',
        suggestion: 'Add <main> element or role="main" to identify main content',
        priority: 'medium'
      });
    }
    
    if (!hasNav) {
      issues.push({
        type: 'info',
        message: 'No navigation landmark found',
        suggestion: 'Consider adding <nav> element for navigation sections',
        priority: 'low'
      });
    }
  };

  const analyzeFormElements = (elements: SemanticElement[], issues: SemanticIssue[]) => {
    const checkForms = (el: SemanticElement) => {
      if (el.tagName === 'input' && !el.hasLabel) {
        issues.push({
          type: 'error',
          message: 'Input element without label',
          element: `<input>`,
          suggestion: 'Add label element or aria-label attribute',
          priority: 'high'
        });
      }
      el.children.forEach(checkForms);
    };
    elements.forEach(checkForms);
  };

  const analyzeInteractiveElements = (elements: SemanticElement[], issues: SemanticIssue[]) => {
    const checkInteractive = (el: SemanticElement) => {
      if (['button', 'a', 'input', 'select'].includes(el.tagName) && !el.hasLabel) {
        issues.push({
          type: 'error',
          message: `Interactive element (${el.tagName}) without accessible name`,
          element: `<${el.tagName}>`,
          suggestion: 'Add text content, aria-label, or aria-labelledby',
          priority: 'high'
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
        <textarea
          value={htmlInput}
          onChange={(e) => setHtmlInput(e.target.value)}
          placeholder="Paste your HTML here..."
          className="w-full h-48 p-4 border rounded-lg font-mono text-sm"
          spellCheck="false"
        />
        <button
          onClick={analyzeSemanticStructure}
          disabled={isAnalyzing || !htmlInput.trim()}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50
                   hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Structure'}
        </button>
      </div>

      {/* Results Section */}
      {structure.length > 0 && (
        <div className="space-y-6">
          {/* Structure Tree */}
          <div className="glass-morphism p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">Document Structure</h3>
            <div className="space-y-2 font-mono text-sm">
              {renderStructureTree(structure)}
            </div>
          </div>

          {/* Issues List */}
          <div className="glass-morphism p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">
              Issues Found
              {issues.length > 0 && (
                <span className="ml-2 text-sm font-normal">
                  ({issues.filter(i => i.type === 'error').length} errors,
                   {issues.filter(i => i.type === 'warning').length} warnings)
                </span>
              )}
            </h3>
            <div className="space-y-4">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    issue.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
                    issue.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                    'bg-blue-50 border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {issue.type === 'error' ? (
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : issue.type === 'warning' ? (
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-800">{issue.message}</h4>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs
                          ${issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                            issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'}`}
                        >
                          {issue.priority} priority
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{issue.suggestion}</p>
                      {issue.element && (
                        <pre className="mt-2 p-2 bg-gray-800 text-white rounded text-xs overflow-x-auto">
                          {issue.element}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderStructureTree(elements: SemanticElement[], depth = 0): JSX.Element[] {
  return elements.map((el, index) => (
    <div key={index} style={{ marginLeft: `${depth * 20}px` }}>
      <div className="flex items-center space-x-2">
        <span className="text-blue-600">&lt;{el.tagName}</span>
        {el.role && <span className="text-purple-600">role="{el.role}"</span>}
        {Object.entries(el.ariaAttributes).map(([key, value]) => (
          <span key={key} className="text-green-600">{key}="{value}"</span>
        ))}
        <span className="text-blue-600">&gt;</span>
      </div>
      {el.text && (
        <div style={{ marginLeft: '20px' }} className="text-gray-600">
          {el.text.length > 50 ? el.text.slice(0, 47) + '...' : el.text}
        </div>
      )}
      {el.children.length > 0 && renderStructureTree(el.children, depth + 1)}
      <div style={{ marginLeft: `${depth * 20}px` }} className="text-blue-600">
        &lt;/{el.tagName}&gt;
      </div>
    </div>
  ));
} 