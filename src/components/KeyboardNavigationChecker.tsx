import React, { useState, useEffect, useRef } from 'react';

interface FocusableElement {
  tagName: string;
  tabIndex: number;
  hasVisibleFocus: boolean;
  ariaLabel?: string;
  role?: string;
  text?: string;
}

interface NavigationIssue {
  type: 'error' | 'warning';
  message: string;
  element?: string;
  suggestion: string;
}

export default function KeyboardNavigationChecker() {
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [focusableElements, setFocusableElements] = useState<FocusableElement[]>([]);
  const [issues, setIssues] = useState<NavigationIssue[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const checkKeyboardNavigation = () => {
    setIsChecking(true);
    const elements: FocusableElement[] = [];
    const newIssues: NavigationIssue[] = [];

    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow || !iframe.contentDocument) {
        throw new Error('Cannot access iframe content');
      }

      // Get all potentially focusable elements
      const focusable = iframe.contentDocument.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      // Check each element
      focusable.forEach((el, index) => {
        const element = el as HTMLElement;
        const computedStyle = window.getComputedStyle(element);
        
        // Basic element info
        const elementInfo: FocusableElement = {
          tagName: element.tagName.toLowerCase(),
          tabIndex: element.tabIndex,
          hasVisibleFocus: computedStyle.outlineStyle !== 'none',
          ariaLabel: element.getAttribute('aria-label') || undefined,
          role: element.getAttribute('role') || undefined,
          text: element.textContent || undefined
        };
        elements.push(elementInfo);

        // Check for common issues
        if (element.tabIndex < 0) {
          newIssues.push({
            type: 'warning',
            message: `Element with negative tabindex found: ${element.tagName}`,
            element: element.outerHTML,
            suggestion: 'Consider removing negative tabindex unless intentionally making element unfocusable'
          });
        }

        if (!elementInfo.hasVisibleFocus) {
          newIssues.push({
            type: 'error',
            message: 'Element lacks visible focus indicator',
            element: element.outerHTML,
            suggestion: 'Add :focus styles or outline to make focus visible'
          });
        }

        if (element.tagName.toLowerCase() === 'a' && !element.textContent?.trim()) {
          newIssues.push({
            type: 'error',
            message: 'Empty link found',
            element: element.outerHTML,
            suggestion: 'Add descriptive text or aria-label to the link'
          });
        }

        // Check for proper heading structure
        if (element.tagName.match(/^H[1-6]$/)) {
          const level = parseInt(element.tagName[1]);
          const prevHeading = element.previousElementSibling?.closest('h1, h2, h3, h4, h5, h6');
          if (prevHeading) {
            const prevLevel = parseInt(prevHeading.tagName[1]);
            if (level - prevLevel > 1) {
              newIssues.push({
                type: 'warning',
                message: `Heading level skipped from ${prevLevel} to ${level}`,
                element: element.outerHTML,
                suggestion: 'Maintain proper heading hierarchy without skipping levels'
              });
            }
          }
        }
      });

      // Check for skip link
      const skipLink = iframe.contentDocument.querySelector('a[href^="#main"], a[href^="#content"]');
      if (!skipLink) {
        newIssues.push({
          type: 'warning',
          message: 'No skip link found',
          suggestion: 'Add a skip link at the beginning of the page to bypass navigation'
        });
      }

      setFocusableElements(elements);
      setIssues(newIssues);
    } catch (error) {
      setIssues([{
        type: 'error',
        message: 'Error checking keyboard navigation',
        suggestion: 'Make sure the URL is accessible and try again'
      }]);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="url"
          placeholder="Enter website URL to check"
          className="flex-1 p-2 border rounded-lg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={checkKeyboardNavigation}
          disabled={isChecking || !url}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50
                   hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isChecking ? 'Checking...' : 'Check Navigation'}
        </button>
      </div>

      {/* Hidden iframe for analysis */}
      <iframe
        ref={iframeRef}
        src={url}
        className="hidden"
        title="Navigation analysis frame"
      />

      {/* Results Section */}
      {focusableElements.length > 0 && (
        <div className="space-y-6">
          <div className="glass-morphism p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">Focusable Elements</h3>
            <div className="space-y-2">
              {focusableElements.map((el, index) => (
                <div key={index} className="p-3 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{el.tagName}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      el.hasVisibleFocus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {el.hasVisibleFocus ? 'Visible Focus' : 'No Focus Style'}
                    </span>
                  </div>
                  {el.ariaLabel && (
                    <p className="text-sm text-gray-600">aria-label: {el.ariaLabel}</p>
                  )}
                  {el.text && (
                    <p className="text-sm text-gray-600 truncate">Text: {el.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-morphism p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">Issues Found</h3>
            <div className="space-y-4">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    issue.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
                    'bg-yellow-50 border-l-4 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {issue.type === 'error' ? (
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-800">{issue.message}</h4>
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