import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

// Create a shared mock analyzeImages function that tests can configure
const mockAnalyzeImages = vi.fn();

// Mock Playwright chromium
vi.mock('@playwright/test', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

// Mock ImageAnalyzer using a function constructor (not arrow function)
vi.mock('@/utils/imageAnalyzer', () => {
  return {
    ImageAnalyzer: function MockImageAnalyzer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).analyzeImages = mockAnalyzeImages;
    },
  };
});

// Mock security validateUrl
vi.mock('@/utils/security', () => ({
  validateUrl: vi.fn(),
}));

// Import after mocks are set up
import { POST } from './route';
import { chromium } from '@playwright/test';
import { validateUrl } from '@/utils/security';

// Helper to create a mock Request with JSON body
function createMockRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Helper to create a mock Request with invalid JSON
function createMalformedRequest(): Request {
  return new Request('http://localhost/api/analyze-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json {',
  });
}

// Sample image analysis results for mocking
const sampleImageAnalysisResult = {
  url: 'https://example.com/image.jpg',
  dimensions: {
    width: 800,
    height: 600,
  },
  performance: {
    loadTime: 150,
    size: 125000,
    format: 'jpg',
    compressionRatio: 15.36,
  },
  accessibility: {
    hasAlt: true,
    altText: 'A sample image',
    isDecorative: false,
    role: undefined,
    ariaLabel: undefined,
    longDescription: undefined,
  },
  responsive: {
    hasSrcSet: true,
    hasSizes: true,
    isResponsive: true,
    breakpoints: ['480w', '800w', '1200w'],
  },
  issues: [],
};

const imageWithIssues = {
  url: 'https://example.com/bad-image.png',
  dimensions: {
    width: 2000,
    height: 2000,
  },
  performance: {
    loadTime: 2500,
    size: 750000,
    format: 'png',
    compressionRatio: 16,
  },
  accessibility: {
    hasAlt: false,
    altText: undefined,
    isDecorative: false,
    role: undefined,
    ariaLabel: undefined,
    longDescription: undefined,
  },
  responsive: {
    hasSrcSet: false,
    hasSizes: false,
    isResponsive: false,
    breakpoints: undefined,
  },
  issues: [
    {
      code: 'LARGE_IMAGE_SIZE',
      message: 'Image file size exceeds recommended limit',
      type: 'warning',
      suggestion: 'Consider compressing the image or using a more efficient format',
    },
    {
      code: 'MISSING_ALT_TEXT',
      message: 'Non-decorative image lacks alternative text',
      type: 'error',
      suggestion: "Add descriptive alt text to convey the image's meaning",
    },
    {
      code: 'NOT_RESPONSIVE',
      message: 'Large image lacks responsive attributes',
      type: 'warning',
      suggestion: 'Use srcset and sizes attributes for responsive images',
    },
  ],
};

describe('/api/analyze-images', () => {
  let mockBrowser: {
    newContext: Mock;
    close: Mock;
  };
  let mockContext: {
    newPage: Mock;
  };
  let mockPage: {
    goto: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock chain: browser -> context -> page
    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
    };

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
    };

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // Setup chromium.launch to return mockBrowser
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('valid input', () => {
    it('returns image analysis results for a valid URL', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([sampleImageAnalysisResult]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBe(1);
    });

    it('launches Playwright browser and navigates to URL', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'https://example.com/page',
      });

      await POST(request);

      expect(chromium.launch).toHaveBeenCalled();
      expect(mockBrowser.newContext).toHaveBeenCalled();
      expect(mockContext.newPage).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com/page', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
    });

    it('closes browser after analysis', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('returns multiple image results when page has multiple images', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([sampleImageAnalysisResult, imageWithIssues]);

      const request = createMockRequest({
        url: 'https://example.com/gallery',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.length).toBe(2);
    });

    it('returns empty results array for page with no images', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'https://example.com/no-images',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
    });

    it('handles HTTPS URLs', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'https://secure.example.com',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPage.goto).toHaveBeenCalledWith('https://secure.example.com', expect.any(Object));
    });

    it('handles HTTP URLs', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'http://example.com',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPage.goto).toHaveBeenCalledWith('http://example.com', expect.any(Object));
    });
  });

  describe('response schema', () => {
    it('returns results array wrapped in response object', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([sampleImageAnalysisResult]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    });

    it('image result has all expected fields', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([sampleImageAnalysisResult]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();
      const result = data.results[0];

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('dimensions');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('accessibility');
      expect(result).toHaveProperty('responsive');
      expect(result).toHaveProperty('issues');
    });

    it('dimensions object has width and height', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([sampleImageAnalysisResult]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();
      const dimensions = data.results[0].dimensions;

      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
      expect(typeof dimensions.width).toBe('number');
      expect(typeof dimensions.height).toBe('number');
    });

    it('performance object has required fields', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([sampleImageAnalysisResult]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();
      const performance = data.results[0].performance;

      expect(performance).toHaveProperty('loadTime');
      expect(performance).toHaveProperty('size');
      expect(performance).toHaveProperty('format');
      expect(typeof performance.loadTime).toBe('number');
      expect(typeof performance.size).toBe('number');
      expect(typeof performance.format).toBe('string');
    });

    it('accessibility object has required fields', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([sampleImageAnalysisResult]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();
      const accessibility = data.results[0].accessibility;

      expect(accessibility).toHaveProperty('hasAlt');
      expect(accessibility).toHaveProperty('isDecorative');
      expect(typeof accessibility.hasAlt).toBe('boolean');
      expect(typeof accessibility.isDecorative).toBe('boolean');
    });

    it('responsive object has required fields', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([sampleImageAnalysisResult]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();
      const responsive = data.results[0].responsive;

      expect(responsive).toHaveProperty('hasSrcSet');
      expect(responsive).toHaveProperty('hasSizes');
      expect(responsive).toHaveProperty('isResponsive');
      expect(typeof responsive.hasSrcSet).toBe('boolean');
      expect(typeof responsive.hasSizes).toBe('boolean');
      expect(typeof responsive.isResponsive).toBe('boolean');
    });

    it('issues array contains properly formatted issue objects', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([imageWithIssues]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();
      const issues = data.results[0].issues;

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);

      const issue = issues[0];
      expect(issue).toHaveProperty('code');
      expect(issue).toHaveProperty('message');
      expect(issue).toHaveProperty('type');
      expect(typeof issue.code).toBe('string');
      expect(typeof issue.message).toBe('string');
      expect(['error', 'warning', 'info']).toContain(issue.type);
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

    it('returns 400 when URL is undefined', async () => {
      const request = createMockRequest({
        url: undefined,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('returns 400 for invalid URL format', async () => {
      vi.mocked(validateUrl).mockResolvedValue({
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

    it('returns 400 for non-HTTP/HTTPS protocol', async () => {
      vi.mocked(validateUrl).mockResolvedValue({
        valid: false,
        error: 'Invalid protocol. Only HTTP and HTTPS are allowed.',
      });

      const request = createMockRequest({
        url: 'ftp://example.com/files',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid protocol. Only HTTP and HTTPS are allowed.');
    });

    it('returns 400 for localhost URLs (SSRF protection)', async () => {
      vi.mocked(validateUrl).mockResolvedValue({
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
      vi.mocked(validateUrl).mockResolvedValue({
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
      vi.mocked(validateUrl).mockResolvedValue({
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

    it('returns 400 for 10.x.x.x range IPs (SSRF protection)', async () => {
      vi.mocked(validateUrl).mockResolvedValue({
        valid: false,
        error: 'Access to private network resources is denied.',
      });

      const request = createMockRequest({
        url: 'http://10.0.0.5',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Access to private network resources is denied.');
    });

    it('returns 400 for unresolvable hostnames', async () => {
      vi.mocked(validateUrl).mockResolvedValue({
        valid: false,
        error: 'Could not resolve hostname.',
      });

      const request = createMockRequest({
        url: 'https://this-domain-does-not-exist-12345.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Could not resolve hostname.');
    });

    it('returns generic error message when security check fails without specific error', async () => {
      vi.mocked(validateUrl).mockResolvedValue({
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
      expect(data.error).toBe('Failed to analyze images');
    });
  });

  describe('browser/playwright errors - 500 errors', () => {
    it('returns 500 when browser fails to launch', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      vi.mocked(chromium.launch).mockRejectedValue(new Error('Browser launch failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze images');
    });

    it('returns 500 when page navigation times out', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

      const request = createMockRequest({
        url: 'https://slow-website.example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze images');
    });

    it('returns 500 when page navigation fails', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockPage.goto.mockRejectedValue(new Error('net::ERR_NAME_NOT_RESOLVED'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze images');
    });

    it('returns 500 when ImageAnalyzer throws an error', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockRejectedValue(new Error('Analysis failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze images');
    });

    it('closes browser even when analysis fails', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockRejectedValue(new Error('Analysis failed'));

      const request = createMockRequest({
        url: 'https://example.com',
      });

      await POST(request);

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('edge cases specific to image analysis', () => {
    it('handles URLs with query parameters', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'https://example.com/page?param=value&other=123',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com/page?param=value&other=123',
        expect.any(Object)
      );
    });

    it('handles URLs with fragments', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'https://example.com/page#section',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles URLs with special characters encoded', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'https://example.com/path%20with%20spaces',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles URLs with ports', async () => {
      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([]);

      const request = createMockRequest({
        url: 'https://example.com:8443/page',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles images with decorative role', async () => {
      const decorativeImage = {
        ...sampleImageAnalysisResult,
        accessibility: {
          hasAlt: true,
          altText: '',
          isDecorative: true,
          role: 'presentation',
          ariaLabel: undefined,
          longDescription: undefined,
        },
        issues: [],
      };

      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([decorativeImage]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].accessibility.isDecorative).toBe(true);
    });

    it('handles images with extreme aspect ratios', async () => {
      const extremeAspectImage = {
        ...sampleImageAnalysisResult,
        dimensions: {
          width: 2000,
          height: 100,
        },
        issues: [
          {
            code: 'EXTREME_ASPECT_RATIO',
            message: 'Image has an unusual aspect ratio',
            type: 'warning',
            suggestion: 'Verify that the image dimensions are intentional',
          },
        ],
      };

      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([extremeAspectImage]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].issues).toContainEqual(
        expect.objectContaining({ code: 'EXTREME_ASPECT_RATIO' })
      );
    });

    it('handles images with very long alt text', async () => {
      const longAltTextImage = {
        ...sampleImageAnalysisResult,
        accessibility: {
          ...sampleImageAnalysisResult.accessibility,
          altText:
            'This is an extremely long alt text that exceeds the recommended length of 125 characters and should trigger a warning about alt text being too verbose and potentially overwhelming for screen reader users.',
        },
        issues: [
          {
            code: 'LONG_ALT_TEXT',
            message: 'Alt text exceeds recommended length',
            type: 'warning',
            suggestion: 'Keep alt text concise and consider using longdesc for detailed descriptions',
          },
        ],
      };

      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([longAltTextImage]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].issues).toContainEqual(
        expect.objectContaining({ code: 'LONG_ALT_TEXT' })
      );
    });

    it('handles different image formats', async () => {
      const webpImage = {
        ...sampleImageAnalysisResult,
        url: 'https://example.com/image.webp',
        performance: {
          ...sampleImageAnalysisResult.performance,
          format: 'webp',
        },
      };

      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([webpImage]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].performance.format).toBe('webp');
    });

    it('handles images without srcset (non-responsive)', async () => {
      const nonResponsiveImage = {
        ...sampleImageAnalysisResult,
        responsive: {
          hasSrcSet: false,
          hasSizes: false,
          isResponsive: false,
          breakpoints: undefined,
        },
      };

      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([nonResponsiveImage]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].responsive.isResponsive).toBe(false);
    });

    it('handles pages with many images', async () => {
      const manyImages = Array(100)
        .fill(null)
        .map((_, index) => ({
          ...sampleImageAnalysisResult,
          url: `https://example.com/image-${index}.jpg`,
        }));

      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue(manyImages);

      const request = createMockRequest({
        url: 'https://example.com/gallery',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.length).toBe(100);
    });

    it('handles zero-dimension images', async () => {
      const zeroDimensionImage = {
        ...sampleImageAnalysisResult,
        dimensions: {
          width: 0,
          height: 0,
        },
      };

      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([zeroDimensionImage]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].dimensions.width).toBe(0);
      expect(data.results[0].dimensions.height).toBe(0);
    });

    it('handles images with aria-label instead of alt', async () => {
      const ariaLabelImage = {
        ...sampleImageAnalysisResult,
        accessibility: {
          hasAlt: false,
          altText: undefined,
          isDecorative: false,
          role: 'img',
          ariaLabel: 'Image description via aria-label',
          longDescription: undefined,
        },
      };

      vi.mocked(validateUrl).mockResolvedValue({ valid: true });
      mockAnalyzeImages.mockResolvedValue([ariaLabelImage]);

      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].accessibility.ariaLabel).toBe('Image description via aria-label');
    });
  });
});
