import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { POST } from './route';

// Create a mock function for analyzeDynamicContent
const mockAnalyzeDynamicContent = vi.fn();

// Mock Playwright chromium
vi.mock('@playwright/test', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

// Mock DynamicContentAnalyzer as a class
vi.mock('@/utils/dynamicContentAnalyzer', () => ({
  DynamicContentAnalyzer: class {
    analyzeDynamicContent = mockAnalyzeDynamicContent;
  },
}));

// Mock validateUrl
vi.mock('@/utils/security', () => ({
  validateUrl: vi.fn(),
}));

import { chromium } from '@playwright/test';
import { validateUrl } from '@/utils/security';

// Helper to create a mock Request with JSON body
function createMockRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze-dynamic-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Helper to create a mock Request with invalid JSON
function createMalformedRequest(): Request {
  return new Request('http://localhost/api/analyze-dynamic-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json {',
  });
}

// Helper to setup browser mocks
function setupBrowserMocks() {
  const mockGoto = vi.fn().mockResolvedValue(undefined);
  const mockPageInstance = { goto: mockGoto };
  const mockContextInstance = { newPage: vi.fn().mockResolvedValue(mockPageInstance) };
  const mockClose = vi.fn().mockResolvedValue(undefined);
  const mockBrowserInstance = {
    newContext: vi.fn().mockResolvedValue(mockContextInstance),
    close: mockClose,
  };

  (chromium.launch as Mock).mockResolvedValue(mockBrowserInstance);

  return { mockGoto, mockPageInstance, mockContextInstance, mockClose, mockBrowserInstance };
}

describe('/api/analyze-dynamic-content', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (validateUrl as Mock).mockResolvedValue({ valid: true });

    mockAnalyzeDynamicContent.mockResolvedValue({
      liveRegions: [],
      dynamicElements: [],
      issues: [],
    });

    setupBrowserMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('valid input', () => {
    it('returns results for valid URL', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('analyzes a URL with HTTPS protocol', async () => {
      const request = createMockRequest({
        url: 'https://example.com/page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      expect(chromium.launch).toHaveBeenCalled();
    });

    it('analyzes a URL with HTTP protocol', async () => {
      const request = createMockRequest({
        url: 'http://example.com/page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('returns live regions from analysis', async () => {
      const mockLiveRegions = [
        {
          element: 'div#status.notification',
          role: 'status',
          ariaLive: 'polite',
          ariaAtomic: true,
          ariaBusy: false,
        },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: mockLiveRegions,
        dynamicElements: [],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.liveRegions).toEqual(mockLiveRegions);
    });

    it('returns dynamic elements from analysis', async () => {
      const mockDynamicElements = [
        {
          type: 'modal',
          role: 'dialog',
          hasAriaControls: true,
          hasAriaExpanded: false,
          hasAriaHidden: false,
          hasAriaModal: true,
          focusManagement: {
            trapsFocus: true,
            restoresFocus: true,
            hasKeyboardNav: true,
          },
          escapeKey: true,
        },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: mockDynamicElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.dynamicElements).toEqual(mockDynamicElements);
    });

    it('returns issues from analysis', async () => {
      const mockIssues = [
        {
          code: 'MODAL_NO_ARIA_MODAL',
          message: 'Modal dialog lacks aria-modal attribute',
          type: 'warning',
          element: 'div#modal.dialog',
          suggestion: 'Add aria-modal="true" to indicate modal behavior',
        },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: [],
        issues: mockIssues,
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.issues).toEqual(mockIssues);
    });

    it('closes browser after analysis', async () => {
      const { mockClose } = setupBrowserMocks();

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('response schema', () => {
    it('returns results object with expected structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(data.results).toHaveProperty('liveRegions');
      expect(data.results).toHaveProperty('dynamicElements');
      expect(data.results).toHaveProperty('issues');
    });

    it('liveRegions is an array', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(Array.isArray(data.results.liveRegions)).toBe(true);
    });

    it('dynamicElements is an array', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(Array.isArray(data.results.dynamicElements)).toBe(true);
    });

    it('issues is an array', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(Array.isArray(data.results.issues)).toBe(true);
    });

    it('live region objects have expected fields', async () => {
      const mockLiveRegion = {
        element: 'div#alert',
        role: 'alert',
        ariaLive: 'assertive',
        ariaAtomic: true,
        ariaBusy: false,
        ariaRelevant: ['additions', 'text'],
      };

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [mockLiveRegion],
        dynamicElements: [],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      const liveRegion = data.results.liveRegions[0];
      expect(liveRegion).toHaveProperty('element');
      expect(liveRegion).toHaveProperty('role');
      expect(liveRegion).toHaveProperty('ariaLive');
    });

    it('dynamic element objects have expected fields', async () => {
      const mockDynamicElement = {
        type: 'toast',
        role: 'status',
        hasAriaControls: false,
        hasAriaExpanded: false,
        hasAriaHidden: false,
        focusManagement: {
          trapsFocus: false,
          restoresFocus: false,
          hasKeyboardNav: false,
        },
        escapeKey: false,
      };

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: [mockDynamicElement],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      const dynamicElement = data.results.dynamicElements[0];
      expect(dynamicElement).toHaveProperty('type');
      expect(dynamicElement).toHaveProperty('role');
      expect(dynamicElement).toHaveProperty('hasAriaControls');
      expect(dynamicElement).toHaveProperty('hasAriaExpanded');
      expect(dynamicElement).toHaveProperty('hasAriaHidden');
      expect(dynamicElement).toHaveProperty('focusManagement');
      expect(dynamicElement).toHaveProperty('escapeKey');
    });

    it('issue objects have expected fields', async () => {
      const mockIssue = {
        code: 'MODAL_NO_LABEL',
        message: 'Modal lacks accessible name',
        type: 'error',
        element: 'div.modal',
        suggestion: 'Add aria-label or aria-labelledby attribute',
      };

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: [],
        issues: [mockIssue],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      const issue = data.results.issues[0];
      expect(issue).toHaveProperty('code');
      expect(issue).toHaveProperty('message');
      expect(issue).toHaveProperty('type');
      expect(issue).toHaveProperty('element');
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

    it('returns 400 for invalid URL format', async () => {
      (validateUrl as Mock).mockResolvedValue({
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

    it('returns 400 for non-HTTP/HTTPS protocols', async () => {
      (validateUrl as Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid protocol. Only HTTP and HTTPS are allowed.',
      });

      const request = createMockRequest({
        url: 'ftp://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid protocol. Only HTTP and HTTPS are allowed.');
    });

    it('returns 400 for localhost URLs (SSRF protection)', async () => {
      (validateUrl as Mock).mockResolvedValue({
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

    it('returns 400 for 127.0.0.1 URLs (SSRF protection)', async () => {
      (validateUrl as Mock).mockResolvedValue({
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

    it('returns 400 for private network IPs (SSRF protection)', async () => {
      (validateUrl as Mock).mockResolvedValue({
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

    it('returns 400 for 10.x.x.x private IPs (SSRF protection)', async () => {
      (validateUrl as Mock).mockResolvedValue({
        valid: false,
        error: 'Access to private network resources is denied.',
      });

      const request = createMockRequest({
        url: 'http://10.0.0.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to private network resources is denied.');
    });

    it('returns 400 for 172.16.x.x private IPs (SSRF protection)', async () => {
      (validateUrl as Mock).mockResolvedValue({
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

    it('returns 400 when DNS resolution fails', async () => {
      (validateUrl as Mock).mockResolvedValue({
        valid: false,
        error: 'Could not resolve hostname.',
      });

      const request = createMockRequest({
        url: 'https://nonexistent-domain-12345.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Could not resolve hostname.');
    });

    it('returns 400 with generic error when validation fails without message', async () => {
      (validateUrl as Mock).mockResolvedValue({
        valid: false,
      });

      const request = createMockRequest({
        url: 'https://invalid.example',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid Request');
    });
  });

  describe('malformed JSON', () => {
    it('returns 500 for malformed JSON body', async () => {
      const request = createMalformedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze dynamic content');
    });
  });

  describe('edge cases', () => {
    it('handles URL with query parameters', async () => {
      const request = createMockRequest({
        url: 'https://example.com/page?foo=bar&baz=qux',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('handles URL with hash fragment', async () => {
      const request = createMockRequest({
        url: 'https://example.com/page#section',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('handles URL with port number', async () => {
      const request = createMockRequest({
        url: 'https://example.com:8443/page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('handles URL with unicode characters', async () => {
      const request = createMockRequest({
        url: 'https://example.com/page/%E2%9C%93',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });

    it('handles page with no dynamic content', async () => {
      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: [],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.liveRegions).toHaveLength(0);
      expect(data.results.dynamicElements).toHaveLength(0);
      expect(data.results.issues).toHaveLength(0);
    });

    it('handles page with multiple live regions', async () => {
      const mockLiveRegions = [
        { element: 'div#status', role: 'status', ariaLive: 'polite' },
        { element: 'div#alert', role: 'alert', ariaLive: 'assertive' },
        { element: 'div#log', role: 'log', ariaLive: 'polite' },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: mockLiveRegions,
        dynamicElements: [],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.liveRegions).toHaveLength(3);
    });

    it('handles page with multiple dynamic element types', async () => {
      const mockDynamicElements = [
        { type: 'modal', role: 'dialog', hasAriaControls: true, hasAriaExpanded: false, hasAriaHidden: false, focusManagement: { trapsFocus: true, restoresFocus: true, hasKeyboardNav: true }, escapeKey: true },
        { type: 'popup', role: 'tooltip', hasAriaControls: false, hasAriaExpanded: true, hasAriaHidden: false, focusManagement: { trapsFocus: false, restoresFocus: false, hasKeyboardNav: false }, escapeKey: false },
        { type: 'toast', role: 'alert', hasAriaControls: false, hasAriaExpanded: false, hasAriaHidden: false, focusManagement: { trapsFocus: false, restoresFocus: false, hasKeyboardNav: false }, escapeKey: false },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: mockDynamicElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.dynamicElements).toHaveLength(3);
      expect(data.results.dynamicElements[0].type).toBe('modal');
      expect(data.results.dynamicElements[1].type).toBe('popup');
      expect(data.results.dynamicElements[2].type).toBe('toast');
    });

    it('handles page with multiple accessibility issues', async () => {
      const mockIssues = [
        { code: 'MODAL_NO_ARIA_MODAL', message: 'Modal dialog lacks aria-modal attribute', type: 'warning', element: 'div.modal' },
        { code: 'MODAL_NO_LABEL', message: 'Modal lacks accessible name', type: 'error', element: 'div.modal' },
        { code: 'POPUP_NO_EXPANDED', message: 'Popup element lacks aria-expanded state', type: 'warning', element: 'button.dropdown' },
        { code: 'TOAST_NO_TIMEOUT', message: 'Toast notification lacks timeout mechanism', type: 'warning', element: 'div.toast' },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: [],
        issues: mockIssues,
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.issues).toHaveLength(4);
    });
  });

  describe('browser and page interaction', () => {
    it('launches browser with chromium', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(chromium.launch).toHaveBeenCalled();
    });

    it('creates browser context with correct viewport', async () => {
      const mockNewContext = vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const mockBrowserInstance = {
        newContext: mockNewContext,
        close: vi.fn().mockResolvedValue(undefined),
      };
      (chromium.launch as Mock).mockResolvedValue(mockBrowserInstance);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockNewContext).toHaveBeenCalledWith({
        viewport: {
          width: 1280,
          height: 800,
        },
      });
    });

    it('navigates to URL with networkidle wait', async () => {
      const mockGoto = vi.fn().mockResolvedValue(undefined);
      const mockPageInstance = {
        goto: mockGoto,
      };

      const mockContextInstance = {
        newPage: vi.fn().mockResolvedValue(mockPageInstance),
      };

      const mockBrowserInstance = {
        newContext: vi.fn().mockResolvedValue(mockContextInstance),
        close: vi.fn().mockResolvedValue(undefined),
      };
      (chromium.launch as Mock).mockResolvedValue(mockBrowserInstance);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockGoto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
    });

    it('closes browser even when analysis throws', async () => {
      const mockClose = vi.fn().mockResolvedValue(undefined);
      const mockBrowserInstance = {
        newContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            goto: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        close: mockClose,
      };
      (chromium.launch as Mock).mockResolvedValue(mockBrowserInstance);

      mockAnalyzeDynamicContent.mockRejectedValue(new Error('Analysis failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('returns 500 when browser launch fails', async () => {
      (chromium.launch as Mock).mockRejectedValue(new Error('Browser launch failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze dynamic content');
    });

    it('returns 500 when page navigation fails', async () => {
      const mockBrowserInstance = {
        newContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            goto: vi.fn().mockRejectedValue(new Error('Navigation timeout')),
          }),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      (chromium.launch as Mock).mockResolvedValue(mockBrowserInstance);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze dynamic content');
    });

    it('returns 500 when analyzer throws error', async () => {
      mockAnalyzeDynamicContent.mockRejectedValue(new Error('Analysis error'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze dynamic content');
    });

    it('returns 500 when context creation fails', async () => {
      const mockBrowserInstance = {
        newContext: vi.fn().mockRejectedValue(new Error('Context creation failed')),
        close: vi.fn().mockResolvedValue(undefined),
      };
      (chromium.launch as Mock).mockResolvedValue(mockBrowserInstance);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze dynamic content');
    });
  });

  describe('issue types', () => {
    it('handles error type issues', async () => {
      const mockIssues = [
        { code: 'MODAL_NO_LABEL', message: 'Modal lacks accessible name', type: 'error', element: 'div.modal' },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: [],
        issues: mockIssues,
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.issues[0].type).toBe('error');
    });

    it('handles warning type issues', async () => {
      const mockIssues = [
        { code: 'MODAL_NO_ARIA_MODAL', message: 'Modal dialog lacks aria-modal attribute', type: 'warning', element: 'div.modal' },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: [],
        issues: mockIssues,
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.issues[0].type).toBe('warning');
    });

    it('handles info type issues', async () => {
      const mockIssues = [
        { code: 'INFO_CODE', message: 'Informational message', type: 'info', element: 'div.info' },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: [],
        issues: mockIssues,
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.issues[0].type).toBe('info');
    });
  });

  describe('dynamic element types', () => {
    it('handles modal type elements', async () => {
      const mockDynamicElements = [
        { type: 'modal', role: 'dialog', hasAriaControls: true, hasAriaExpanded: false, hasAriaHidden: false, hasAriaModal: true, focusManagement: { trapsFocus: true, restoresFocus: true, hasKeyboardNav: true }, escapeKey: true },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: mockDynamicElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.dynamicElements[0].type).toBe('modal');
    });

    it('handles popup type elements', async () => {
      const mockDynamicElements = [
        { type: 'popup', role: 'tooltip', hasAriaControls: false, hasAriaExpanded: true, hasAriaHidden: false, focusManagement: { trapsFocus: false, restoresFocus: false, hasKeyboardNav: false }, escapeKey: false },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: mockDynamicElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.dynamicElements[0].type).toBe('popup');
    });

    it('handles toast type elements', async () => {
      const mockDynamicElements = [
        { type: 'toast', role: 'alert', hasAriaControls: false, hasAriaExpanded: false, hasAriaHidden: false, focusManagement: { trapsFocus: false, restoresFocus: false, hasKeyboardNav: false }, escapeKey: false },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: mockDynamicElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.dynamicElements[0].type).toBe('toast');
    });

    it('handles menu type elements', async () => {
      const mockDynamicElements = [
        { type: 'menu', role: 'menu', hasAriaControls: true, hasAriaExpanded: true, hasAriaHidden: false, focusManagement: { trapsFocus: false, restoresFocus: true, hasKeyboardNav: true }, escapeKey: true },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: mockDynamicElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.dynamicElements[0].type).toBe('menu');
    });

    it('handles tabpanel type elements', async () => {
      const mockDynamicElements = [
        { type: 'tabpanel', role: 'tabpanel', hasAriaControls: true, hasAriaExpanded: false, hasAriaHidden: false, focusManagement: { trapsFocus: false, restoresFocus: false, hasKeyboardNav: true }, escapeKey: false },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: mockDynamicElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.dynamicElements[0].type).toBe('tabpanel');
    });

    it('handles other type elements', async () => {
      const mockDynamicElements = [
        { type: 'other', role: 'region', hasAriaControls: false, hasAriaExpanded: false, hasAriaHidden: false, focusManagement: { trapsFocus: false, restoresFocus: false, hasKeyboardNav: false }, escapeKey: false },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: [],
        dynamicElements: mockDynamicElements,
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.dynamicElements[0].type).toBe('other');
    });
  });

  describe('live region aria-live values', () => {
    it('handles polite live regions', async () => {
      const mockLiveRegions = [
        { element: 'div#status', role: 'status', ariaLive: 'polite' },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: mockLiveRegions,
        dynamicElements: [],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.liveRegions[0].ariaLive).toBe('polite');
    });

    it('handles assertive live regions', async () => {
      const mockLiveRegions = [
        { element: 'div#alert', role: 'alert', ariaLive: 'assertive' },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: mockLiveRegions,
        dynamicElements: [],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.liveRegions[0].ariaLive).toBe('assertive');
    });

    it('handles off live regions', async () => {
      const mockLiveRegions = [
        { element: 'div#disabled', role: 'region', ariaLive: 'off' },
      ];

      mockAnalyzeDynamicContent.mockResolvedValue({
        liveRegions: mockLiveRegions,
        dynamicElements: [],
        issues: [],
      });

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.liveRegions[0].ariaLive).toBe('off');
    });
  });
});
