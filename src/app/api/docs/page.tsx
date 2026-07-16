import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "REST endpoints for WCAG 2.1 contrast ratios and accessible colour palettes.",
};

export default function ApiDocs() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-h1 mb-8 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
        API Documentation
      </h1>

      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <h2 className="text-h2 text-white mb-4">Introduction</h2>
          <p className="text-muted-foreground text-body leading-relaxed">
            The Precision Contrast API provides programmatic access to color
            contrast checking and palette generation. It&apos;s RESTful and
            returns JSON responses.
          </p>
        </section>

        {/* Authentication */}
        <section>
          <h2 className="text-h2 text-white mb-4">Authentication</h2>
          <p className="text-muted-foreground text-body leading-relaxed">
            Currently, the API is free to use without authentication. Rate
            limiting may be implemented in the future.
          </p>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="text-h2 text-white mb-6">Endpoints</h2>

          {/* Contrast Check Endpoint */}
          <div className="glass-card rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="badge-pass px-3 py-1 rounded-md text-caption font-semibold">
                POST
              </span>
              <code className="text-white font-mono text-body-sm">
                /api/v1/contrast
              </code>
            </div>

            <h3 className="text-h3 text-white mb-4">Check Color Contrast</h3>

            <div className="mb-6">
              <h4 className="text-body-sm font-medium text-white mb-2">
                Request Body
              </h4>
              <pre className="code-block p-4 text-green-400">
                {`{
  "foreground": "#000000",  // Hex color code for text
  "background": "#FFFFFF"   // Hex color code for background
}`}
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="text-body-sm font-medium text-white mb-2">
                Response
              </h4>
              <pre className="code-block p-4 text-green-400">
                {`{
  "contrast": 21,          // Contrast ratio
  "AA": {
    "normal": true,       // Passes AA for normal text
    "large": true        // Passes AA for large text
  },
  "AAA": {
    "normal": true,      // Passes AAA for normal text
    "large": true       // Passes AAA for large text
  },
  "foreground": "#000000",
  "background": "#FFFFFF"
}`}
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="text-body-sm font-medium text-white mb-2">
                Example Usage
              </h4>
              <pre className="code-block p-4 text-blue-400">
                {`fetch('/api/v1/contrast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    foreground: '#000000',
    background: '#FFFFFF'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
              </pre>
            </div>
          </div>

          {/* Color Palettes Endpoint */}
          <div className="glass-card rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="badge-pass px-3 py-1 rounded-md text-caption font-semibold">
                POST
              </span>
              <code className="text-white font-mono text-body-sm">
                /api/v1/palettes
              </code>
            </div>

            <h3 className="text-h3 text-white mb-4">Generate Color Palettes</h3>

            <div className="mb-6">
              <h4 className="text-body-sm font-medium text-white mb-2">
                Request Body
              </h4>
              <pre className="code-block p-4 text-green-400">
                {`{
  "color": "#1A365D",     // Base hex color code
  "type": "accessible"    // Optional: "accessible" | "analogous" | "all"
}`}
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="text-body-sm font-medium text-white mb-2">
                Response
              </h4>
              <pre className="code-block p-4 text-green-400">
                {`{
  "palettes": [
    {
      "name": "Accessible Combinations",
      "colors": [
        {
          "foreground": "#1A365D",
          "background": "#FFFFFF",
          "contrast": 12.5,
          "AA": {
            "normal": true,
            "large": true
          },
          "AAA": {
            "normal": true,
            "large": true
          }
        },
        // ... more color combinations
      ]
    },
    {
      "name": "Analogous Combinations",
      "colors": [
        // ... analogous color combinations
      ]
    }
  ]
}`}
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="text-body-sm font-medium text-white mb-2">
                Example Usage
              </h4>
              <pre className="code-block p-4 text-blue-400">
                {`fetch('/api/v1/palettes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    color: '#1A365D',
    type: 'all'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
              </pre>
            </div>
          </div>
        </section>

        {/* Error Handling */}
        <section>
          <h2 className="text-h2 text-white mb-6">Error Handling</h2>

          <div className="glass-card rounded-lg p-6">
            <h3 className="text-h3 text-white mb-4">Error Responses</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-body-sm font-medium text-white mb-2">
                  400 Bad Request
                </h4>
                <pre className="code-block p-4 text-red-400">
                  {`{
  "error": "Both foreground and background colors are required"
}`}
                </pre>
              </div>

              <div>
                <h4 className="text-body-sm font-medium text-white mb-2">
                  400 Invalid Format
                </h4>
                <pre className="code-block p-4 text-red-400">
                  {`{
  "error": "Colors must be in valid hex format (e.g., #FF0000)"
}`}
                </pre>
              </div>

              <div>
                <h4 className="text-body-sm font-medium text-white mb-2">
                  500 Internal Server Error
                </h4>
                <pre className="code-block p-4 text-red-400">
                  {`{
  "error": "Internal server error"
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section>
          <h2 className="text-h2 text-white mb-4">Rate Limiting</h2>
          <p className="text-muted-foreground text-body leading-relaxed">
            These endpoints allow 20 requests per 10 seconds per IP. Exceeding
            that returns <code className="text-white">429</code> with{" "}
            <code className="text-white">RateLimit-Limit</code>,{" "}
            <code className="text-white">RateLimit-Reset</code> and{" "}
            <code className="text-white">Retry-After</code> headers. Handle 429
            by backing off until <code className="text-white">Retry-After</code>{" "}
            elapses.
          </p>
        </section>

        {/* SDKs and Libraries */}
        <section>
          <h2 className="text-h2 text-white mb-4">Code Examples</h2>
          <p className="text-muted-foreground text-body leading-relaxed mb-6">
            Quick examples for common languages:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-lg p-6">
              <h3 className="text-h3 text-white mb-4">JavaScript</h3>
              <pre className="code-block p-4 text-yellow-400">
                {`// npm install accessibility-checker-api

import { AccessibilityChecker } from 'accessibility-checker-api';

const checker = new AccessibilityChecker();
const result = await checker.checkContrast('#000000', '#FFFFFF');`}
              </pre>
            </div>

            <div className="glass-card rounded-lg p-6">
              <h3 className="text-h3 text-white mb-4">Python</h3>
              <pre className="code-block p-4 text-yellow-400">
                {`# pip install accessibility-checker

from accessibility_checker import ContrastChecker

checker = ContrastChecker()
result = checker.check_contrast('#000000', '#FFFFFF')`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
