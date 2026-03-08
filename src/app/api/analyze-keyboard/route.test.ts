import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Playwright - must be defined before other mocks since they may depend on it
const mockGoto = vi.fn();
const mockNewPage = vi.fn();
const mockNewContext = vi.fn();
const mockBrowserClose = vi.fn();
const mockLaunch = vi.fn();

vi.mock('@playwright/test', () => ({
  chromium: {
    launch: () => mockLaunch(),
  },
}));

// Mock the security validation
const mockValidateUrl = vi.fn();
vi.mock('@/utils/security', () => ({
  validateUrl: (url: string) => mockValidateUrl(url),
}));

// Mock the KeyboardNavigationAnalyzer
const mockAnalyze = vi.fn();
vi.mock('@/utils/keyboardNavigationAnalyzer', () => ({
  KeyboardNavigationAnalyzer: class MockKeyboardNavigationAnalyzer {
    analyze = mockAnalyze;
  },
}));

import { POST } from './route';

// Helper to create a mock Request with JSON body
function createMockRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze-keyboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Helper to create a mock Request with invalid JSON
function createMalformedRequest(): Request {
  return new Request('http://localhost/api/analyze-keyboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json {',
  });
}

// Sample analysis result for mocking
const mockAnalysisResult = {
  focusableElements: [
    {
      tagName: 'button',
      tabIndex: 0,
      hasVisibleFocus: true,
      ariaLabel: 'Submit form',
      role: 'button',
      text: 'Submit',
    },
    {
      tagName: 'a',
      tabIndex: 0,
      hasVisibleFocus: true,
      text: 'Home',
    },
    {
      tagName: 'input',
      tabIndex: 0,
      hasVisibleFocus: false,
      ariaLabel: 'Email',
    },
  ],
  issues: [
    {
      type: 'error',
      message: 'Element lacks visible focus indicator',
      element: '<input type="text" class="email-input">',
      suggestion: 'Add focus-visible styles with a clear outline or box shadow.',
    },
    {
      type: 'warning',
      message: 'No skip link found',
      suggestion: 'Add a skip link at the top of the page.',
    },
  ],
};

describe('/api/analyze-keyboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    const mockPage = {
      goto: mockGoto.mockResolvedValue(undefined),
    };

    const mockContext = {
      newPage: mockNewPage.mockResolvedValue(mockPage),
    };

    const mockBrowser = {
      newContext: mockNewContext.mockResolvedValue(mockContext),
      close: mockBrowserClose.mockResolvedValue(undefined),
    };

    mockLaunch.mockResolvedValue(mockBrowser);

    // Default: URL validation passes
    mockValidateUrl.mockResolvedValue({ valid: true });

    // Default: analyzer returns mock results
    mockAnalyze.mockResolvedValue(mockAnalysisResult);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('valid input', () => {
    it('returns keyboard analysis results for valid URL', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      expect(data.results.focusableElements).toEqual(mockAnalysisResult.focusableElements);
      expect(data.results.issues).toEqual(mockAnalysisResult.issues);
    });

    it('calls validateUrl with the provided URL', async () => {
      const request = createMockRequest({
        url: 'https://example.com/page',
      });

      await POST(request);

      expect(mockValidateUrl).toHaveBeenCalledWith('https://example.com/page');
    });

    it('launches browser and navigates to URL', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockLaunch).toHaveBeenCalled();
      expect(mockNewContext).toHaveBeenCalledWith({
        viewport: { width: 1280, height: 800 },
      });
      expect(mockNewPage).toHaveBeenCalled();
      expect(mockGoto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
    });

    it('closes browser after analysis', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockBrowserClose).toHaveBeenCalled();
    });

    it('handles URL with query parameters', async () => {
      const request = createMockRequest({
        url: 'https://example.com/search?q=test&page=1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      expect(mockGoto).toHaveBeenCalledWith(
        'https://example.com/search?q=test&page=1',
        expect.any(Object)
      );
    });

    it('handles URL with fragments', async () => {
      const request = createMockRequest({
        url: 'https://example.com/page#section',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('handles URL with ports', async () => {
      const request = createMockRequest({
        url: 'https://example.com:8080/page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });
  });

  describe('response schema', () => {
    it('returns results object with focusableElements and issues arrays', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(data.results).toHaveProperty('focusableElements');
      expect(data.results).toHaveProperty('issues');
      expect(Array.isArray(data.results.focusableElements)).toBe(true);
      expect(Array.isArray(data.results.issues)).toBe(true);
    });

    it('focusableElements have expected structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      const element = data.results.focusableElements[0];
      expect(element).toHaveProperty('tagName');
      expect(element).toHaveProperty('tabIndex');
      expect(element).toHaveProperty('hasVisibleFocus');
      expect(typeof element.tagName).toBe('string');
      expect(typeof element.tabIndex).toBe('number');
      expect(typeof element.hasVisibleFocus).toBe('boolean');
    });

    it('issues have expected structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      const issue = data.results.issues[0];
      expect(issue).toHaveProperty('type');
      expect(issue).toHaveProperty('message');
      expect(issue).toHaveProperty('suggestion');
      expect(['error', 'warning']).toContain(issue.type);
      expect(typeof issue.message).toBe('string');
      expect(typeof issue.suggestion).toBe('string');
    });

    it('issues may have optional element field', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      // First issue has element, second does not
      expect(data.results.issues[0]).toHaveProperty('element');
      expect(data.results.issues[1]).not.toHaveProperty('element');
    });

    it('focusableElements may have optional ariaLabel and role fields', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      // First element has ariaLabel and role
      expect(data.results.focusableElements[0].ariaLabel).toBe('Submit form');
      expect(data.results.focusableElements[0].role).toBe('button');
      // Second element does not have these
      expect(data.results.focusableElements[1].ariaLabel).toBeUndefined();
      expect(data.results.focusableElements[1].role).toBeUndefined();
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

    it('returns 400 for invalid protocol (file://)', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Invalid protocol. Only HTTP and HTTPS are allowed.',
      });

      const request = createMockRequest({
        url: 'file:///etc/passwd',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid protocol. Only HTTP and HTTPS are allowed.');
    });

    it('returns 400 for invalid protocol (javascript:)', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Invalid protocol. Only HTTP and HTTPS are allowed.',
      });

      const request = createMockRequest({
        url: 'javascript:alert(1)',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid protocol. Only HTTP and HTTPS are allowed.');
    });

    it('returns 400 for localhost URLs', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to localhost is denied.',
      });

      const request = createMockRequest({
        url: 'http://localhost:3000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to localhost is denied.');
    });

    it('returns 400 for 127.0.0.1 URLs', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to localhost is denied.',
      });

      const request = createMockRequest({
        url: 'http://127.0.0.1:8080',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to localhost is denied.');
    });

    it('returns 400 for private network IPs (10.x.x.x)', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to private network resources is denied.',
      });

      const request = createMockRequest({
        url: 'http://10.0.0.1/admin',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to private network resources is denied.');
    });

    it('returns 400 for private network IPs (192.168.x.x)', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to private network resources is denied.',
      });

      const request = createMockRequest({
        url: 'http://192.168.1.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to private network resources is denied.');
    });

    it('returns 400 for private network IPs (172.16-31.x.x)', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to private network resources is denied.',
      });

      const request = createMockRequest({
        url: 'http://172.16.0.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to private network resources is denied.');
    });

    it('returns 400 for unresolvable hostnames', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Could not resolve hostname.',
      });

      const request = createMockRequest({
        url: 'https://thishostnamedoesnotexist12345.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Could not resolve hostname.');
    });

    it('returns 400 for invalid URL format', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Invalid URL format.',
      });

      const request = createMockRequest({
        url: 'not-a-valid-url',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL format.');
    });

    it('returns default error when validateUrl returns no error message', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Request');
    });
  });

  describe('malformed JSON - 500 errors', () => {
    it('returns 500 for malformed JSON body', async () => {
      const request = createMalformedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze keyboard navigation');
    });
  });

  describe('browser/navigation errors - 500 errors', () => {
    it('returns 500 when browser launch fails', async () => {
      mockLaunch.mockRejectedValue(new Error('Browser launch failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze keyboard navigation');
    });

    it('returns 500 when page navigation fails', async () => {
      mockGoto.mockRejectedValue(new Error('Navigation timeout'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze keyboard navigation');
    });

    it('returns 500 when analyzer fails', async () => {
      mockAnalyze.mockRejectedValue(new Error('Analysis failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze keyboard navigation');
    });

    it('closes browser even when navigation fails', async () => {
      mockGoto.mockRejectedValue(new Error('Navigation timeout'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockBrowserClose).toHaveBeenCalled();
    });

    it('closes browser even when analysis fails', async () => {
      mockAnalyze.mockRejectedValue(new Error('Analysis failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockBrowserClose).toHaveBeenCalled();
    });
  });

  describe('edge cases - keyboard analysis specific', () => {
    it('handles pages with no focusable elements', async () => {
      mockAnalyze.mockResolvedValue({
        focusableElements: [],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.focusableElements).toEqual([]);
      expect(data.results.issues).toEqual([]);
    });

    it('handles pages with many focusable elements', async () => {
      const manyElements = Array.from({ length: 100 }, (_, i) => ({
        tagName: 'button',
        tabIndex: 0,
        hasVisibleFocus: true,
        text: `Button ${i}`,
      }));

      mockAnalyze.mockResolvedValue({
        focusableElements: manyElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.focusableElements.length).toBe(100);
    });

    it('handles pages with many issues', async () => {
      const manyIssues = Array.from({ length: 50 }, (_, i) => ({
        type: 'error' as const,
        message: `Issue ${i}`,
        suggestion: `Fix suggestion ${i}`,
      }));

      mockAnalyze.mockResolvedValue({
        focusableElements: [],
        issues: manyIssues,
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.issues.length).toBe(50);
    });

    it('handles elements with negative tabindex', async () => {
      mockAnalyze.mockResolvedValue({
        focusableElements: [
          { tagName: 'div', tabIndex: -1, hasVisibleFocus: false },
        ],
        issues: [
          {
            type: 'warning',
            message: 'Element with negative tabindex found: div',
            element: '<div tabindex="-1">',
            suggestion: 'Avoid negative tabindex unless intentionally removing focus.',
          },
        ],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.focusableElements[0].tabIndex).toBe(-1);
      expect(data.results.issues[0].type).toBe('warning');
    });

    it('handles heading hierarchy issues', async () => {
      mockAnalyze.mockResolvedValue({
        focusableElements: [],
        issues: [
          {
            type: 'warning',
            message: 'Heading level skipped from h1 to h3',
            element: '<h3>Section Title</h3>',
            suggestion: 'Maintain sequential heading hierarchy.',
          },
        ],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.issues[0].message).toContain('Heading level skipped');
    });

    it('handles skip link issues', async () => {
      mockAnalyze.mockResolvedValue({
        focusableElements: [],
        issues: [
          {
            type: 'warning',
            message: 'No skip link found',
            suggestion: 'Add a skip link at the top of the page.',
          },
        ],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.issues[0].message).toBe('No skip link found');
    });

    it('handles elements missing accessible names', async () => {
      mockAnalyze.mockResolvedValue({
        focusableElements: [
          { tagName: 'button', tabIndex: 0, hasVisibleFocus: true },
        ],
        issues: [
          {
            type: 'error',
            message: 'Interactive element (button) lacks an accessible name',
            element: '<button></button>',
            suggestion: 'Add text content, aria-label, or aria-labelledby.',
          },
        ],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.issues[0].type).toBe('error');
      expect(data.results.issues[0].message).toContain('lacks an accessible name');
    });

    it('handles mixed issue types (errors and warnings)', async () => {
      mockAnalyze.mockResolvedValue({
        focusableElements: [],
        issues: [
          {
            type: 'error',
            message: 'Element lacks visible focus indicator',
            suggestion: 'Add focus-visible styles.',
          },
          {
            type: 'warning',
            message: 'No skip link found',
            suggestion: 'Add a skip link.',
          },
          {
            type: 'error',
            message: 'Interactive element lacks accessible name',
            suggestion: 'Add aria-label.',
          },
        ],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const errors = data.results.issues.filter(
        (i: { type: string }) => i.type === 'error'
      );
      const warnings = data.results.issues.filter(
        (i: { type: string }) => i.type === 'warning'
      );
      expect(errors.length).toBe(2);
      expect(warnings.length).toBe(1);
    });

    it('handles different focusable element types', async () => {
      const diverseElements = [
        { tagName: 'a', tabIndex: 0, hasVisibleFocus: true, text: 'Link' },
        { tagName: 'button', tabIndex: 0, hasVisibleFocus: true, text: 'Button' },
        { tagName: 'input', tabIndex: 0, hasVisibleFocus: true, ariaLabel: 'Input' },
        { tagName: 'select', tabIndex: 0, hasVisibleFocus: true },
        { tagName: 'textarea', tabIndex: 0, hasVisibleFocus: true },
        { tagName: 'div', tabIndex: 0, hasVisibleFocus: true, role: 'button' },
      ];

      mockAnalyze.mockResolvedValue({
        focusableElements: diverseElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.focusableElements.length).toBe(6);
      expect(data.results.focusableElements.map((e: { tagName: string }) => e.tagName)).toEqual([
        'a',
        'button',
        'input',
        'select',
        'textarea',
        'div',
      ]);
    });

    it('handles elements with positive tabindex values', async () => {
      mockAnalyze.mockResolvedValue({
        focusableElements: [
          { tagName: 'input', tabIndex: 1, hasVisibleFocus: true },
          { tagName: 'input', tabIndex: 2, hasVisibleFocus: true },
          { tagName: 'button', tabIndex: 0, hasVisibleFocus: true },
        ],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.focusableElements[0].tabIndex).toBe(1);
      expect(data.results.focusableElements[1].tabIndex).toBe(2);
    });

    it('handles Unicode in element text', async () => {
      mockAnalyze.mockResolvedValue({
        focusableElements: [
          { tagName: 'button', tabIndex: 0, hasVisibleFocus: true, text: 'Enviar mensaje' },
          { tagName: 'a', tabIndex: 0, hasVisibleFocus: true, text: '日本語' },
          { tagName: 'button', tabIndex: 0, hasVisibleFocus: true, text: 'Emoji' },
        ],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.focusableElements[0].text).toBe('Enviar mensaje');
      expect(data.results.focusableElements[1].text).toBe('日本語');
      expect(data.results.focusableElements[2].text).toBe('Emoji');
    });
  });
});
