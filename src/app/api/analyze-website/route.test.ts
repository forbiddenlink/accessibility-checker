import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create module-level mock functions that can be controlled from tests
const mockAnalyzeWebsite = vi.fn();
const mockValidateUrl = vi.fn();

// Mock the WebsiteAnalyzer module with a proper class
vi.mock('@/utils/websiteAnalyzer', () => ({
  WebsiteAnalyzer: class MockWebsiteAnalyzer {
    analyzeWebsite(url: string) {
      return mockAnalyzeWebsite(url);
    }
  },
}));

// Mock the security module
vi.mock('@/utils/security', () => ({
  validateUrl: (url: string) => mockValidateUrl(url),
}));

// Import after mocking
import { POST } from './route';

// Helper to create a mock Request with JSON body
function createMockRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze-website', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Helper to create a mock Request with invalid JSON
function createMalformedRequest(): Request {
  return new Request('http://localhost/api/analyze-website', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json {',
  });
}

// Sample successful analysis result
const mockAnalysisResult = {
  url: 'https://example.com',
  pages: [
    {
      path: '/',
      accessibility: {
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
            nodes: ['<p style="color: #aaa">Low contrast text</p>'],
            help: 'Elements must have sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          },
        ],
        passes: 15,
        incomplete: 2,
        inapplicable: 5,
      },
      loadTime: 1234,
      resources: {
        images: 5,
        scripts: 3,
        stylesheets: 2,
      },
    },
  ],
  totalViolations: 1,
  totalPasses: 15,
  commonIssues: ['color-contrast (found 1 times)'],
  htmlValidation: [] as Array<{ type: string; message: string; line: number; column: number }>,
};

// Helper to setup mocks for a successful analysis
function setupSuccessfulMocks(result = mockAnalysisResult) {
  mockValidateUrl.mockResolvedValue({ valid: true });
  mockAnalyzeWebsite.mockResolvedValue(result);
}

describe('/api/analyze-website', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('valid input', () => {
    it('returns analysis results for a valid URL', async () => {
      setupSuccessfulMocks();

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      expect(data.results.url).toBe('https://example.com');
    });

    it('calls WebsiteAnalyzer with the provided URL', async () => {
      setupSuccessfulMocks();

      const request = createMockRequest({
        url: 'https://test-website.com',
      });

      await POST(request);

      expect(mockAnalyzeWebsite).toHaveBeenCalledWith('https://test-website.com');
    });

    it('handles HTTP URLs', async () => {
      setupSuccessfulMocks({
        ...mockAnalysisResult,
        url: 'http://example.com',
      });

      const request = createMockRequest({
        url: 'http://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.url).toBe('http://example.com');
    });

    it('handles URLs with paths', async () => {
      setupSuccessfulMocks({
        ...mockAnalysisResult,
        url: 'https://example.com/path/to/page',
      });

      const request = createMockRequest({
        url: 'https://example.com/path/to/page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.url).toBe('https://example.com/path/to/page');
    });

    it('handles URLs with query parameters', async () => {
      setupSuccessfulMocks({
        ...mockAnalysisResult,
        url: 'https://example.com?param=value',
      });

      const request = createMockRequest({
        url: 'https://example.com?param=value',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });
  });

  describe('response schema', () => {
    beforeEach(() => {
      setupSuccessfulMocks();
    });

    it('returns results object with expected top-level fields', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(data.results).toHaveProperty('url');
      expect(data.results).toHaveProperty('pages');
      expect(data.results).toHaveProperty('totalViolations');
      expect(data.results).toHaveProperty('totalPasses');
      expect(data.results).toHaveProperty('commonIssues');
      expect(data.results).toHaveProperty('htmlValidation');
    });

    it('pages array contains expected structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(Array.isArray(data.results.pages)).toBe(true);
      if (data.results.pages.length > 0) {
        const page = data.results.pages[0];
        expect(page).toHaveProperty('path');
        expect(page).toHaveProperty('accessibility');
        expect(page).toHaveProperty('loadTime');
        expect(page).toHaveProperty('resources');
      }
    });

    it('accessibility results have expected structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      if (data.results.pages.length > 0) {
        const accessibility = data.results.pages[0].accessibility;
        expect(accessibility).toHaveProperty('violations');
        expect(accessibility).toHaveProperty('passes');
        expect(accessibility).toHaveProperty('incomplete');
        expect(accessibility).toHaveProperty('inapplicable');
        expect(Array.isArray(accessibility.violations)).toBe(true);
      }
    });

    it('violations have expected structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      if (data.results.pages.length > 0 && data.results.pages[0].accessibility.violations.length > 0) {
        const violation = data.results.pages[0].accessibility.violations[0];
        expect(violation).toHaveProperty('id');
        expect(violation).toHaveProperty('impact');
        expect(violation).toHaveProperty('description');
        expect(violation).toHaveProperty('nodes');
        expect(violation).toHaveProperty('help');
        expect(violation).toHaveProperty('helpUrl');
      }
    });

    it('resources object has expected structure', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      if (data.results.pages.length > 0) {
        const resources = data.results.pages[0].resources;
        expect(resources).toHaveProperty('images');
        expect(resources).toHaveProperty('scripts');
        expect(resources).toHaveProperty('stylesheets');
        expect(typeof resources.images).toBe('number');
        expect(typeof resources.scripts).toBe('number');
        expect(typeof resources.stylesheets).toBe('number');
      }
    });

    it('totalViolations and totalPasses are numbers', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(typeof data.results.totalViolations).toBe('number');
      expect(typeof data.results.totalPasses).toBe('number');
    });

    it('commonIssues is an array of strings', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(Array.isArray(data.results.commonIssues)).toBe(true);
      if (data.results.commonIssues.length > 0) {
        expect(typeof data.results.commonIssues[0]).toBe('string');
      }
    });

    it('htmlValidation is an array', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(Array.isArray(data.results.htmlValidation)).toBe(true);
    });
  });

  describe('invalid input - 400 errors', () => {
    it('returns 400 for localhost URL', async () => {
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

    it('returns 400 for 127.0.0.1 URL', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to localhost is denied.',
      });

      const request = createMockRequest({
        url: 'http://127.0.0.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to localhost is denied.');
    });

    it('returns 400 for private IP (10.x.x.x)', async () => {
      mockValidateUrl.mockResolvedValue({
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

    it('returns 400 for private IP (192.168.x.x)', async () => {
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

    it('returns 400 for private IP (172.16-31.x.x)', async () => {
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

    it('returns 400 for invalid protocol (ftp)', async () => {
      mockValidateUrl.mockResolvedValue({
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

    it('returns 400 for invalid protocol (file)', async () => {
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

    it('returns 400 for unresolvable hostname', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Could not resolve hostname.',
      });

      const request = createMockRequest({
        url: 'https://this-domain-definitely-does-not-exist-12345.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Could not resolve hostname.');
    });

    it('returns 400 with default error when validateUrl returns no error message', async () => {
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

    it('returns 400 for IPv6 localhost', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to localhost is denied.',
      });

      const request = createMockRequest({
        url: 'http://[::1]',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to localhost is denied.');
    });

    it('returns 400 for 0.0.0.0', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to localhost is denied.',
      });

      const request = createMockRequest({
        url: 'http://0.0.0.0',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to localhost is denied.');
    });
  });

  describe('malformed JSON - 500 errors', () => {
    it('returns 500 for malformed JSON body', async () => {
      const request = createMalformedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze website');
    });

    it('returns 500 when WebsiteAnalyzer throws an error', async () => {
      mockValidateUrl.mockResolvedValue({ valid: true });
      mockAnalyzeWebsite.mockRejectedValue(new Error('Browser launch failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze website');
    });

    it('returns 500 when validateUrl throws an unexpected error', async () => {
      mockValidateUrl.mockRejectedValue(new Error('Unexpected DNS error'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze website');
    });
  });

  describe('edge cases for website analysis', () => {
    it('handles website with no violations', async () => {
      const noViolationsResult = {
        ...mockAnalysisResult,
        pages: [
          {
            ...mockAnalysisResult.pages[0],
            accessibility: {
              violations: [],
              passes: 25,
              incomplete: 0,
              inapplicable: 3,
            },
          },
        ],
        totalViolations: 0,
        totalPasses: 25,
        commonIssues: [],
      };
      setupSuccessfulMocks(noViolationsResult);

      const request = createMockRequest({
        url: 'https://accessible-website.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.totalViolations).toBe(0);
      expect(data.results.pages[0].accessibility.violations).toHaveLength(0);
    });

    it('handles website with multiple pages', async () => {
      const multiPageResult = {
        ...mockAnalysisResult,
        pages: [
          mockAnalysisResult.pages[0],
          {
            path: '/about',
            accessibility: {
              violations: [],
              passes: 20,
              incomplete: 1,
              inapplicable: 4,
            },
            loadTime: 987,
            resources: {
              images: 3,
              scripts: 2,
              stylesheets: 1,
            },
          },
          {
            path: '/contact',
            accessibility: {
              violations: [
                {
                  id: 'label',
                  impact: 'critical',
                  description: 'Form elements must have labels',
                  nodes: ['<input type="text">'],
                  help: 'Form elements must have labels',
                  helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
                },
              ],
              passes: 18,
              incomplete: 0,
              inapplicable: 2,
            },
            loadTime: 756,
            resources: {
              images: 1,
              scripts: 2,
              stylesheets: 1,
            },
          },
        ],
        totalViolations: 2,
        totalPasses: 53,
        commonIssues: ['color-contrast (found 1 times)', 'label (found 1 times)'],
      };
      setupSuccessfulMocks(multiPageResult);

      const request = createMockRequest({
        url: 'https://multi-page-site.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.pages).toHaveLength(3);
      expect(data.results.totalViolations).toBe(2);
    });

    it('handles website with many common issues', async () => {
      const manyIssuesResult = {
        ...mockAnalysisResult,
        commonIssues: [
          'color-contrast (found 15 times)',
          'image-alt (found 12 times)',
          'link-name (found 8 times)',
          'button-name (found 5 times)',
          'label (found 3 times)',
        ],
      };
      setupSuccessfulMocks(manyIssuesResult);

      const request = createMockRequest({
        url: 'https://issues-site.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.commonIssues).toHaveLength(5);
    });

    it('handles empty pages array', async () => {
      const emptyPagesResult = {
        ...mockAnalysisResult,
        pages: [],
        totalViolations: 0,
        totalPasses: 0,
        commonIssues: [],
      };
      setupSuccessfulMocks(emptyPagesResult);

      const request = createMockRequest({
        url: 'https://empty-site.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.pages).toHaveLength(0);
    });

    it('handles URL with port number', async () => {
      setupSuccessfulMocks({
        ...mockAnalysisResult,
        url: 'https://example.com:8443',
      });

      const request = createMockRequest({
        url: 'https://example.com:8443',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockAnalyzeWebsite).toHaveBeenCalledWith('https://example.com:8443');
    });

    it('handles URL with subdomain', async () => {
      setupSuccessfulMocks({
        ...mockAnalysisResult,
        url: 'https://www.subdomain.example.com',
      });

      const request = createMockRequest({
        url: 'https://www.subdomain.example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.url).toBe('https://www.subdomain.example.com');
    });

    it('handles pages with high load times', async () => {
      const slowPageResult = {
        ...mockAnalysisResult,
        pages: [
          {
            ...mockAnalysisResult.pages[0],
            loadTime: 30000, // 30 seconds
          },
        ],
      };
      setupSuccessfulMocks(slowPageResult);

      const request = createMockRequest({
        url: 'https://slow-website.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.pages[0].loadTime).toBe(30000);
    });

    it('handles pages with many resources', async () => {
      const heavyResourceResult = {
        ...mockAnalysisResult,
        pages: [
          {
            ...mockAnalysisResult.pages[0],
            resources: {
              images: 150,
              scripts: 45,
              stylesheets: 20,
            },
          },
        ],
      };
      setupSuccessfulMocks(heavyResourceResult);

      const request = createMockRequest({
        url: 'https://heavy-resources-site.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.pages[0].resources.images).toBe(150);
      expect(data.results.pages[0].resources.scripts).toBe(45);
      expect(data.results.pages[0].resources.stylesheets).toBe(20);
    });

    it('handles violations with multiple affected nodes', async () => {
      const multiNodeResult = {
        ...mockAnalysisResult,
        pages: [
          {
            ...mockAnalysisResult.pages[0],
            accessibility: {
              violations: [
                {
                  id: 'image-alt',
                  impact: 'critical',
                  description: 'Images must have alternate text',
                  nodes: [
                    '<img src="photo1.jpg">',
                    '<img src="photo2.jpg">',
                    '<img src="photo3.jpg">',
                    '<img src="photo4.jpg">',
                    '<img src="photo5.jpg">',
                  ],
                  help: 'Images must have alternate text',
                  helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
                },
              ],
              passes: 10,
              incomplete: 0,
              inapplicable: 2,
            },
          },
        ],
      };
      setupSuccessfulMocks(multiNodeResult);

      const request = createMockRequest({
        url: 'https://missing-alts.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.pages[0].accessibility.violations[0].nodes).toHaveLength(5);
    });

    it('handles HTML validation results', async () => {
      const htmlValidationResult = {
        ...mockAnalysisResult,
        htmlValidation: [
          {
            type: 'error',
            message: 'Element "div" not allowed as child of element "span"',
            line: 42,
            column: 15,
          },
          {
            type: 'warning',
            message: 'The "type" attribute is unnecessary for JavaScript resources',
            line: 10,
            column: 5,
          },
        ],
      };
      setupSuccessfulMocks(htmlValidationResult);

      const request = createMockRequest({
        url: 'https://html-issues.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.htmlValidation).toHaveLength(2);
      expect(data.results.htmlValidation[0].type).toBe('error');
      expect(data.results.htmlValidation[1].type).toBe('warning');
    });
  });

  describe('SSRF protection', () => {
    it('validates URL before analysis', async () => {
      setupSuccessfulMocks();

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockValidateUrl).toHaveBeenCalledWith('https://example.com');
      expect(mockValidateUrl).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeWebsite).toHaveBeenCalledTimes(1);
    });

    it('does not call analyzer when URL validation fails', async () => {
      mockValidateUrl.mockResolvedValue({
        valid: false,
        error: 'Access to localhost is denied.',
      });

      const request = createMockRequest({
        url: 'http://localhost',
      });

      await POST(request);

      expect(mockAnalyzeWebsite).not.toHaveBeenCalled();
    });
  });
});
