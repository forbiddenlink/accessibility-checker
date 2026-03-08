import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Helper to create a mock Request with JSON body
function createMockRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/palettes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Helper to create a mock Request with invalid JSON
function createMalformedRequest(): Request {
  return new Request('http://localhost/api/v1/palettes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json {',
  });
}

describe('/api/v1/palettes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('valid input', () => {
    it('returns accessible palette by default', async () => {
      const request = createMockRequest({
        color: '#2C5282',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes).toBeDefined();
      expect(Array.isArray(data.palettes)).toBe(true);
      expect(data.palettes.length).toBeGreaterThan(0);
      expect(data.palettes[0].name).toBe('Accessible Combinations');
    });

    it('returns accessible palette when type is accessible', async () => {
      const request = createMockRequest({
        color: '#2C5282',
        type: 'accessible',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes.length).toBe(1);
      expect(data.palettes[0].name).toBe('Accessible Combinations');
    });

    it('returns analogous palette when type is analogous', async () => {
      const request = createMockRequest({
        color: '#2C5282',
        type: 'analogous',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes.length).toBe(1);
      expect(data.palettes[0].name).toBe('Analogous Combinations');
    });

    it('returns both palette types when type is all', async () => {
      const request = createMockRequest({
        color: '#2C5282',
        type: 'all',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes.length).toBe(2);
      expect(data.palettes[0].name).toBe('Accessible Combinations');
      expect(data.palettes[1].name).toBe('Analogous Combinations');
    });

    it('handles short hex format', async () => {
      const request = createMockRequest({
        color: '#F00',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes).toBeDefined();
    });

    it('handles lowercase hex colors', async () => {
      const request = createMockRequest({
        color: '#ff0000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes).toBeDefined();
    });
  });

  describe('response schema', () => {
    it('returns palettes array with expected structure', async () => {
      const request = createMockRequest({
        color: '#2C5282',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('palettes');
      expect(Array.isArray(data.palettes)).toBe(true);
    });

    it('palette objects have name and colors array', async () => {
      const request = createMockRequest({
        color: '#2C5282',
      });

      const response = await POST(request);
      const data = await response.json();

      const palette = data.palettes[0];
      expect(palette).toHaveProperty('name');
      expect(palette).toHaveProperty('colors');
      expect(typeof palette.name).toBe('string');
      expect(Array.isArray(palette.colors)).toBe(true);
    });

    it('color combinations have all required fields', async () => {
      const request = createMockRequest({
        color: '#2C5282',
      });

      const response = await POST(request);
      const data = await response.json();

      const colors = data.palettes[0].colors;
      if (colors.length > 0) {
        const colorCombo = colors[0];
        expect(colorCombo).toHaveProperty('foreground');
        expect(colorCombo).toHaveProperty('background');
        expect(colorCombo).toHaveProperty('contrast');
        expect(colorCombo).toHaveProperty('AA');
        expect(colorCombo).toHaveProperty('AAA');
        expect(colorCombo.AA).toHaveProperty('normal');
        expect(colorCombo.AA).toHaveProperty('large');
        expect(colorCombo.AAA).toHaveProperty('normal');
        expect(colorCombo.AAA).toHaveProperty('large');
      }
    });

    it('contrast values are numbers', async () => {
      const request = createMockRequest({
        color: '#2C5282',
      });

      const response = await POST(request);
      const data = await response.json();

      const colors = data.palettes[0].colors;
      if (colors.length > 0) {
        expect(typeof colors[0].contrast).toBe('number');
      }
    });

    it('AA and AAA values are booleans', async () => {
      const request = createMockRequest({
        color: '#2C5282',
      });

      const response = await POST(request);
      const data = await response.json();

      const colors = data.palettes[0].colors;
      if (colors.length > 0) {
        expect(typeof colors[0].AA.normal).toBe('boolean');
        expect(typeof colors[0].AA.large).toBe('boolean');
        expect(typeof colors[0].AAA.normal).toBe('boolean');
        expect(typeof colors[0].AAA.large).toBe('boolean');
      }
    });

    it('colors are sorted by contrast (highest first)', async () => {
      const request = createMockRequest({
        color: '#2C5282',
      });

      const response = await POST(request);
      const data = await response.json();

      const colors = data.palettes[0].colors;
      for (let i = 1; i < colors.length; i++) {
        expect(colors[i - 1].contrast).toBeGreaterThanOrEqual(colors[i].contrast);
      }
    });
  });

  describe('invalid input - 400 errors', () => {
    it('returns 400 when color is missing', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Base color is required');
    });

    it('returns 400 when color is empty string', async () => {
      const request = createMockRequest({
        color: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid hex format - no hash', async () => {
      const request = createMockRequest({
        color: 'FF0000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Color must be in valid hex format (e.g., #FF0000)');
    });

    it('returns 400 for invalid hex format - wrong length', async () => {
      const request = createMockRequest({
        color: '#FF00',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Color must be in valid hex format (e.g., #FF0000)');
    });

    it('returns 400 for invalid hex characters', async () => {
      const request = createMockRequest({
        color: '#GGGGGG',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Color must be in valid hex format (e.g., #FF0000)');
    });

    it('returns 400 for hex with 4 characters', async () => {
      const request = createMockRequest({
        color: '#FFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Color must be in valid hex format (e.g., #FF0000)');
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

  describe('palette content validation', () => {
    it('all returned combinations meet at least AA large criteria', async () => {
      const request = createMockRequest({
        color: '#2C5282',
      });

      const response = await POST(request);
      const data = await response.json();

      const colors = data.palettes[0].colors;
      for (const combo of colors) {
        expect(combo.AA.normal || combo.AA.large).toBe(true);
      }
    });

    it('uses input color as foreground in accessible palette', async () => {
      const inputColor = '#2C5282';
      const request = createMockRequest({
        color: inputColor,
      });

      const response = await POST(request);
      const data = await response.json();

      const colors = data.palettes[0].colors;
      for (const combo of colors) {
        expect(combo.foreground.toLowerCase()).toBe(inputColor.toLowerCase());
      }
    });

    it('returns different colors for different inputs', async () => {
      const request1 = createMockRequest({
        color: '#FF0000',
      });
      const request2 = createMockRequest({
        color: '#0000FF',
      });

      const response1 = await POST(request1);
      const response2 = await POST(request2);
      const data1 = await response1.json();
      const data2 = await response2.json();

      // The foreground colors should be different
      expect(data1.palettes[0].colors[0].foreground).not.toBe(
        data2.palettes[0].colors[0].foreground
      );
    });
  });

  describe('edge cases', () => {
    it('handles black color', async () => {
      const request = createMockRequest({
        color: '#000000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes).toBeDefined();
    });

    it('handles white color', async () => {
      const request = createMockRequest({
        color: '#FFFFFF',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes).toBeDefined();
    });

    it('handles unknown type parameter by returning both palettes', async () => {
      const request = createMockRequest({
        color: '#2C5282',
        type: 'unknown-type',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.palettes.length).toBe(2);
    });
  });
});
