import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock functions at module level - these will be hoisted correctly
const mockAnalyzeForms = vi.fn();
const mockGoto = vi.fn();
const mockBrowserClose = vi.fn();
const mockNewPage = vi.fn();
const mockNewContext = vi.fn();
const mockLaunch = vi.fn();

// Mock Playwright - use functions that return the mocks
vi.mock('@playwright/test', () => ({
  chromium: {
    launch: () => mockLaunch(),
  },
}));

// Mock FormAnalyzer as a proper class
vi.mock('@/utils/formAnalyzer', () => ({
  FormAnalyzer: class MockFormAnalyzer {
    analyzeForms() {
      return mockAnalyzeForms();
    }
  },
}));

// Mock validateUrl
vi.mock('@/utils/security', () => ({
  validateUrl: async (url: string) => {
    // Simulate various URL validation scenarios
    if (url === 'http://localhost:3000') {
      return { valid: false, error: 'Access to localhost is denied.' };
    }
    if (url === 'http://127.0.0.1:8080') {
      return { valid: false, error: 'Access to localhost is denied.' };
    }
    if (url === 'http://192.168.1.1') {
      return { valid: false, error: 'Access to private network resources is denied.' };
    }
    if (url === 'http://10.0.0.1') {
      return { valid: false, error: 'Access to private network resources is denied.' };
    }
    if (url === 'ftp://example.com') {
      return { valid: false, error: 'Invalid protocol. Only HTTP and HTTPS are allowed.' };
    }
    if (url === 'javascript:alert(1)') {
      return { valid: false, error: 'Invalid protocol. Only HTTP and HTTPS are allowed.' };
    }
    if (url === 'http://nonexistent.invalid.domain') {
      return { valid: false, error: 'Could not resolve hostname.' };
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { valid: false, error: 'Invalid URL format.' };
    }
    return { valid: true };
  },
}));

import { POST } from './route';

// Helper to create a mock Request with JSON body
function createMockRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze-forms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Helper to create a mock Request with invalid JSON
function createMalformedRequest(): Request {
  return new Request('http://localhost/api/analyze-forms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json {',
  });
}

// Default mock form analysis result
const defaultFormResults = [
  {
    role: 'form',
    name: 'contact-form',
    method: 'post',
    fields: [
      {
        type: 'text',
        name: 'email',
        id: 'email-input',
        hasLabel: true,
        required: true,
        ariaLabels: true,
        value: '',
      },
    ],
    issues: [
      {
        code: 'REQUIRED_NO_ARIA',
        message: 'Required field missing aria-required attribute',
        severity: 'warning',
        suggestion: 'Add aria-required="true" to required fields',
      },
    ],
  },
];

// Setup default mock implementations
function setupDefaultMocks() {
  mockGoto.mockResolvedValue(undefined);
  mockBrowserClose.mockResolvedValue(undefined);
  mockAnalyzeForms.mockResolvedValue(defaultFormResults);

  const mockPage = {
    goto: mockGoto,
  };

  mockNewPage.mockResolvedValue(mockPage);

  const mockContext = {
    newPage: mockNewPage,
  };

  mockNewContext.mockResolvedValue(mockContext);

  const mockBrowser = {
    newContext: mockNewContext,
    close: mockBrowserClose,
  };

  mockLaunch.mockResolvedValue(mockBrowser);
}

describe('/api/analyze-forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  describe('valid input', () => {
    it('returns form analysis results for valid URL', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
    });

    it('returns results with correct form structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.length).toBeGreaterThan(0);

      const form = data.results[0];
      expect(form.role).toBe('form');
      expect(form.name).toBe('contact-form');
      expect(form.method).toBe('post');
    });

    it('handles HTTP URLs correctly', async () => {
      const request = createMockRequest({
        url: 'http://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('handles HTTPS URLs correctly', async () => {
      const request = createMockRequest({
        url: 'https://secure.example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('handles URLs with query parameters', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page?tab=contact&lang=en',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('handles URLs with fragments', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page#form-section',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });
  });

  describe('response schema', () => {
    it('returns results array with expected structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    });

    it('form results have role, method, fields, and issues', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      const form = data.results[0];
      expect(form).toHaveProperty('role');
      expect(form).toHaveProperty('method');
      expect(form).toHaveProperty('fields');
      expect(form).toHaveProperty('issues');
      expect(typeof form.role).toBe('string');
      expect(typeof form.method).toBe('string');
      expect(Array.isArray(form.fields)).toBe(true);
      expect(Array.isArray(form.issues)).toBe(true);
    });

    it('form fields have correct structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      const field = data.results[0].fields[0];
      expect(field).toHaveProperty('type');
      expect(field).toHaveProperty('hasLabel');
      expect(field).toHaveProperty('required');
      expect(field).toHaveProperty('ariaLabels');
      expect(typeof field.type).toBe('string');
      expect(typeof field.hasLabel).toBe('boolean');
      expect(typeof field.required).toBe('boolean');
      expect(typeof field.ariaLabels).toBe('boolean');
    });

    it('form issues have code, message, and severity', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      const issue = data.results[0].issues[0];
      expect(issue).toHaveProperty('code');
      expect(issue).toHaveProperty('message');
      expect(issue).toHaveProperty('severity');
      expect(typeof issue.code).toBe('string');
      expect(typeof issue.message).toBe('string');
      expect(['error', 'warning', 'info']).toContain(issue.severity);
    });

    it('form name is optional', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      // name may be undefined or a string
      const form = data.results[0];
      if (form.name !== undefined) {
        expect(typeof form.name).toBe('string');
      }
    });

    it('issue suggestion is optional', async () => {
      const request = createMockRequest({
        url: 'https://example.com/form-page',
      });

      const response = await POST(request);
      const data = await response.json();

      const issue = data.results[0].issues[0];
      if (issue.suggestion !== undefined) {
        expect(typeof issue.suggestion).toBe('string');
      }
    });
  });

  describe('invalid input - 400 errors', () => {
    it('returns 400 when URL is missing', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('returns 400 when URL is empty string', async () => {
      const request = createMockRequest({
        url: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('returns 400 when URL is null', async () => {
      const request = createMockRequest({
        url: null,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('returns 400 for localhost URLs (SSRF protection)', async () => {
      const request = createMockRequest({
        url: 'http://localhost:3000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to localhost is denied.');
    });

    it('returns 400 for 127.0.0.1 URLs (SSRF protection)', async () => {
      const request = createMockRequest({
        url: 'http://127.0.0.1:8080',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to localhost is denied.');
    });

    it('returns 400 for private network IPs - 192.168.x.x', async () => {
      const request = createMockRequest({
        url: 'http://192.168.1.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to private network resources is denied.');
    });

    it('returns 400 for private network IPs - 10.x.x.x', async () => {
      const request = createMockRequest({
        url: 'http://10.0.0.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to private network resources is denied.');
    });

    it('returns 400 for invalid protocol - FTP', async () => {
      const request = createMockRequest({
        url: 'ftp://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid protocol. Only HTTP and HTTPS are allowed.');
    });

    it('returns 400 for javascript: protocol (XSS protection)', async () => {
      const request = createMockRequest({
        url: 'javascript:alert(1)',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid protocol. Only HTTP and HTTPS are allowed.');
    });

    it('returns 400 for unresolvable hostnames', async () => {
      const request = createMockRequest({
        url: 'http://nonexistent.invalid.domain',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Could not resolve hostname.');
    });

    it('returns 400 for invalid URL format', async () => {
      const request = createMockRequest({
        url: 'not-a-valid-url',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL format.');
    });
  });

  describe('malformed JSON - 500 errors', () => {
    it('returns 500 for malformed JSON body', async () => {
      const request = createMalformedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze forms');
    });
  });

  describe('edge cases specific to form analysis', () => {
    it('handles pages with no forms', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([]);

      const request = createMockRequest({
        url: 'https://example.com/no-forms-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
    });

    it('handles pages with multiple forms', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'form',
          name: 'search-form',
          method: 'get',
          fields: [{ type: 'search', hasLabel: true, required: false, ariaLabels: true }],
          issues: [],
        },
        {
          role: 'form',
          name: 'contact-form',
          method: 'post',
          fields: [
            { type: 'email', hasLabel: true, required: true, ariaLabels: true },
            { type: 'textarea', hasLabel: true, required: false, ariaLabels: false },
          ],
          issues: [
            {
              code: 'REQUIRED_NO_ARIA',
              message: 'Required field missing aria-required attribute',
              severity: 'warning',
            },
          ],
        },
        {
          role: 'form',
          name: 'newsletter-form',
          method: 'post',
          fields: [{ type: 'email', hasLabel: false, required: true, ariaLabels: false }],
          issues: [
            {
              code: 'FIELD_NO_LABEL',
              message: 'email field lacks a proper label',
              severity: 'error',
            },
          ],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/multiple-forms-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.length).toBe(3);
    });

    it('handles forms with no issues', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'form',
          name: 'perfect-form',
          method: 'post',
          fields: [
            {
              type: 'text',
              name: 'username',
              id: 'username',
              hasLabel: true,
              required: true,
              ariaLabels: true,
            },
          ],
          issues: [],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/accessible-form',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].issues).toEqual([]);
    });

    it('handles forms with multiple issues', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'form',
          method: 'get',
          fields: [
            { type: 'text', hasLabel: false, required: true, ariaLabels: false },
            { type: 'email', hasLabel: false, required: true, ariaLabels: false },
          ],
          issues: [
            { code: 'FORM_NO_IDENTIFIER', message: 'Form lacks a name or id attribute', severity: 'warning' },
            { code: 'FIELD_NO_LABEL', message: 'text field lacks a proper label', severity: 'error' },
            { code: 'FIELD_NO_LABEL', message: 'email field lacks a proper label', severity: 'error' },
            { code: 'REQUIRED_NO_ARIA', message: 'Required field missing aria-required attribute', severity: 'warning' },
            { code: 'NO_FIELDSETS', message: 'Form with multiple fields lacks grouping', severity: 'warning' },
            { code: 'NO_SUBMISSION_FEEDBACK', message: 'Form lacks submission status announcement', severity: 'warning' },
          ],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/problematic-form',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].issues.length).toBe(6);
    });

    it('handles forms with various field types', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'form',
          name: 'comprehensive-form',
          method: 'post',
          fields: [
            { type: 'text', name: 'name', hasLabel: true, required: true, ariaLabels: true },
            { type: 'email', name: 'email', hasLabel: true, required: true, ariaLabels: true },
            { type: 'password', name: 'password', hasLabel: true, required: true, ariaLabels: true },
            { type: 'tel', name: 'phone', hasLabel: true, required: false, ariaLabels: true },
            { type: 'number', name: 'age', hasLabel: true, required: false, ariaLabels: true },
            { type: 'date', name: 'dob', hasLabel: true, required: false, ariaLabels: true },
            { type: 'checkbox', name: 'agree', hasLabel: true, required: true, ariaLabels: true },
            { type: 'radio', name: 'gender', hasLabel: true, required: false, ariaLabels: true },
            { type: 'select', name: 'country', hasLabel: true, required: true, ariaLabels: true },
            { type: 'textarea', name: 'bio', hasLabel: true, required: false, ariaLabels: true },
            { type: 'file', name: 'avatar', hasLabel: true, required: false, ariaLabels: true },
            { type: 'hidden', name: 'csrf', hasLabel: false, required: false, ariaLabels: false },
          ],
          issues: [],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/comprehensive-form',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].fields.length).toBe(12);
    });

    it('handles forms with different severity levels', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'form',
          name: 'mixed-issues-form',
          method: 'post',
          fields: [{ type: 'text', hasLabel: false, required: true, ariaLabels: false }],
          issues: [
            { code: 'FIELD_NO_LABEL', message: 'text field lacks a proper label', severity: 'error' },
            { code: 'REQUIRED_NO_ARIA', message: 'Required field missing aria-required attribute', severity: 'warning' },
            { code: 'FORM_ENHANCEMENT', message: 'Consider adding autocomplete attribute', severity: 'info' },
          ],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/mixed-severity',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const severities = data.results[0].issues.map((i: { severity: string }) => i.severity);
      expect(severities).toContain('error');
      expect(severities).toContain('warning');
      expect(severities).toContain('info');
    });

    it('handles forms with GET method', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'form',
          name: 'search-form',
          method: 'get',
          fields: [{ type: 'search', name: 'q', hasLabel: true, required: false, ariaLabels: true }],
          issues: [],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/search',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].method).toBe('get');
    });

    it('handles forms with POST method', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'form',
          name: 'login-form',
          method: 'post',
          fields: [
            { type: 'email', name: 'email', hasLabel: true, required: true, ariaLabels: true },
            { type: 'password', name: 'password', hasLabel: true, required: true, ariaLabels: true },
          ],
          issues: [],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/login',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].method).toBe('post');
    });

    it('handles forms without name attribute', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'form',
          name: undefined,
          method: 'post',
          fields: [{ type: 'text', hasLabel: true, required: false, ariaLabels: true }],
          issues: [
            { code: 'FORM_NO_IDENTIFIER', message: 'Form lacks a name or id attribute', severity: 'warning' },
          ],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/unnamed-form',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].name).toBeUndefined();
    });

    it('handles forms with custom role attribute', async () => {
      mockAnalyzeForms.mockResolvedValueOnce([
        {
          role: 'search',
          name: 'site-search',
          method: 'get',
          fields: [{ type: 'search', hasLabel: true, required: false, ariaLabels: true }],
          issues: [],
        },
      ]);

      const request = createMockRequest({
        url: 'https://example.com/search-form',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].role).toBe('search');
    });
  });

  describe('browser error handling', () => {
    it('returns 500 when page navigation fails', async () => {
      mockGoto.mockRejectedValueOnce(new Error('Navigation timeout'));

      const request = createMockRequest({
        url: 'https://example.com/timeout-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze forms');
    });

    it('returns 500 when form analysis throws error', async () => {
      mockAnalyzeForms.mockRejectedValueOnce(new Error('Analysis failed'));

      const request = createMockRequest({
        url: 'https://example.com/error-page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze forms');
    });

    it('closes browser even when analysis fails', async () => {
      mockAnalyzeForms.mockRejectedValueOnce(new Error('Analysis failed'));

      const request = createMockRequest({
        url: 'https://example.com/error-page',
      });

      await POST(request);

      expect(mockBrowserClose).toHaveBeenCalled();
    });
  });
});
