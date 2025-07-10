export default function ApiDocs() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
        Color Contrast API Documentation
      </h1>

      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-slate-600 mb-4">
            Our Color Contrast API provides a simple way to check if your color combinations meet WCAG accessibility standards.
            The API is RESTful and returns JSON responses.
          </p>
        </section>

        {/* Authentication */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <p className="text-slate-600 mb-4">
            Currently, the API is free to use without authentication. Rate limiting may be implemented in the future.
          </p>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Endpoints</h2>
          
          {/* Contrast Check Endpoint */}
          <div className="glass-morphism p-6 rounded-xl mb-8">
            <div className="flex items-center mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">POST</span>
              <code className="text-slate-800 font-mono">/api/v1/contrast</code>
            </div>

            <h3 className="text-xl font-medium mb-4">Check Color Contrast</h3>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Request Body</h4>
              <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
{`{
  "foreground": "#000000",  // Hex color code for text
  "background": "#FFFFFF"   // Hex color code for background
}`}
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="font-medium mb-2">Response</h4>
              <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
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
              <h4 className="font-medium mb-2">Example Usage</h4>
              <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
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
          <div className="glass-morphism p-6 rounded-xl mb-8">
            <div className="flex items-center mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">POST</span>
              <code className="text-slate-800 font-mono">/api/v1/palettes</code>
            </div>

            <h3 className="text-xl font-medium mb-4">Generate Color Palettes</h3>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Request Body</h4>
              <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
{`{
  "color": "#1A365D",     // Base hex color code
  "type": "accessible"    // Optional: "accessible" | "analogous" | "all"
}`}
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="font-medium mb-2">Response</h4>
              <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
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
              <h4 className="font-medium mb-2">Example Usage</h4>
              <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
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
          <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
          
          <div className="glass-morphism p-6 rounded-xl">
            <h3 className="text-xl font-medium mb-4">Error Responses</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">400 Bad Request</h4>
                <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
{`{
  "error": "Both foreground and background colors are required"
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">400 Invalid Format</h4>
                <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
{`{
  "error": "Colors must be in valid hex format (e.g., #FF0000)"
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">500 Internal Server Error</h4>
                <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
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
          <h2 className="text-2xl font-semibold mb-4">Rate Limiting</h2>
          <p className="text-slate-600">
            Currently, there are no rate limits in place. However, we recommend implementing appropriate caching and error handling in your applications.
          </p>
        </section>

        {/* SDKs and Libraries */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">SDKs and Libraries</h2>
          <p className="text-slate-600 mb-4">
            We provide code examples in multiple languages to help you integrate with our API:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-morphism p-6 rounded-xl">
              <h3 className="text-lg font-medium mb-4">JavaScript/TypeScript</h3>
              <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
{`// npm install accessibility-checker-api

import { AccessibilityChecker } from 'accessibility-checker-api';

const checker = new AccessibilityChecker();
const result = await checker.checkContrast('#000000', '#FFFFFF');`}
              </pre>
            </div>

            <div className="glass-morphism p-6 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Python</h3>
              <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto">
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