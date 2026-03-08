import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Helper to create a mock Request with JSON body
function createMockRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/contrast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Helper to create a mock Request with invalid JSON
function createMalformedRequest(): Request {
  return new Request('http://localhost/api/v1/contrast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json {',
  });
}

describe('/api/v1/contrast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('valid input', () => {
    it('returns correct contrast ratio for black on white', async () => {
      const request = createMockRequest({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contrast).toBeCloseTo(21, 0);
      expect(data.foreground).toBe('#000000');
      expect(data.background).toBe('#FFFFFF');
      expect(data.AA.normal).toBe(true);
      expect(data.AA.large).toBe(true);
      expect(data.AAA.normal).toBe(true);
      expect(data.AAA.large).toBe(true);
    });

    it('returns correct contrast ratio for white on black', async () => {
      const request = createMockRequest({
        foreground: '#FFFFFF',
        background: '#000000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contrast).toBeCloseTo(21, 0);
    });

    it('handles low contrast colors correctly', async () => {
      // Gray on slightly darker gray - low contrast
      const request = createMockRequest({
        foreground: '#777777',
        background: '#666666',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contrast).toBeLessThan(4.5);
      expect(data.AA.normal).toBe(false);
    });

    it('handles short hex format', async () => {
      const request = createMockRequest({
        foreground: '#000',
        background: '#FFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contrast).toBeCloseTo(21, 0);
    });

    it('handles lowercase hex colors', async () => {
      const request = createMockRequest({
        foreground: '#ff0000',
        background: '#ffffff',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.foreground).toBe('#ff0000');
      expect(data.background).toBe('#ffffff');
    });
  });

  describe('response schema', () => {
    it('returns all expected fields', async () => {
      const request = createMockRequest({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('contrast');
      expect(data).toHaveProperty('foreground');
      expect(data).toHaveProperty('background');
      expect(data).toHaveProperty('AA');
      expect(data).toHaveProperty('AAA');
      expect(data.AA).toHaveProperty('normal');
      expect(data.AA).toHaveProperty('large');
      expect(data.AAA).toHaveProperty('normal');
      expect(data.AAA).toHaveProperty('large');
    });

    it('contrast is a number', async () => {
      const request = createMockRequest({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(typeof data.contrast).toBe('number');
    });

    it('AA and AAA values are booleans', async () => {
      const request = createMockRequest({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(typeof data.AA.normal).toBe('boolean');
      expect(typeof data.AA.large).toBe('boolean');
      expect(typeof data.AAA.normal).toBe('boolean');
      expect(typeof data.AAA.large).toBe('boolean');
    });
  });

  describe('invalid input - 400 errors', () => {
    it('returns 400 when foreground is missing', async () => {
      const request = createMockRequest({
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Both foreground and background colors are required');
    });

    it('returns 400 when background is missing', async () => {
      const request = createMockRequest({
        foreground: '#000000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Both foreground and background colors are required');
    });

    it('returns 400 when both colors are missing', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Both foreground and background colors are required');
    });

    it('returns 400 for invalid hex format - no hash', async () => {
      const request = createMockRequest({
        foreground: '000000',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Colors must be in valid hex format (e.g., #FF0000)');
    });

    it('returns 400 for invalid hex format - wrong length', async () => {
      const request = createMockRequest({
        foreground: '#00000',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Colors must be in valid hex format (e.g., #FF0000)');
    });

    it('returns 400 for invalid hex characters', async () => {
      const request = createMockRequest({
        foreground: '#GGGGGG',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Colors must be in valid hex format (e.g., #FF0000)');
    });

    it('returns 400 when foreground is empty string', async () => {
      const request = createMockRequest({
        foreground: '',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('returns 400 when background is empty string', async () => {
      const request = createMockRequest({
        foreground: '#000000',
        background: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('malformed JSON', () => {
    it('returns 500 for malformed JSON body', async () => {
      const request = createMalformedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('WCAG compliance thresholds', () => {
    it('correctly identifies AA normal pass at 4.5:1', async () => {
      // #595959 on white gives approximately 7:1 contrast
      const request = createMockRequest({
        foreground: '#595959',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.contrast).toBeGreaterThanOrEqual(4.5);
      expect(data.AA.normal).toBe(true);
    });

    it('correctly identifies AA large pass at 3:1', async () => {
      // #767676 on white gives approximately 4.54:1 contrast (AA pass for large)
      const request = createMockRequest({
        foreground: '#767676',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.contrast).toBeGreaterThanOrEqual(3);
      expect(data.AA.large).toBe(true);
    });

    it('correctly identifies AAA normal pass at 7:1', async () => {
      // #595959 on white gives approximately 7:1 contrast
      const request = createMockRequest({
        foreground: '#595959',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.contrast).toBeGreaterThanOrEqual(7);
      expect(data.AAA.normal).toBe(true);
    });

    it('correctly identifies failing contrast', async () => {
      // #999999 on white fails AA normal
      const request = createMockRequest({
        foreground: '#999999',
        background: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.contrast).toBeLessThan(4.5);
      expect(data.AA.normal).toBe(false);
    });
  });
});
