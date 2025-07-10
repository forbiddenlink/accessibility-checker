import { NextResponse } from 'next/server';
import { chromium } from '@playwright/test';

interface ImageData {
  url: string;
  altText: string;
  dimensions: {
    width: number;
    height: number;
  };
  isDecorative: boolean;
}

interface ImageIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

interface ImageAnalysisResult extends ImageData {
  loadTime: number;
  fileSize: number;
  format: string;
  issues: ImageIssue[];
}

export const runtime = 'nodejs'; // Force Node.js runtime instead of Edge

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    const browser = await chromium.launch();
    
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Get all images on the page
      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => ({
          url: img.src,
          altText: img.alt,
          dimensions: {
            width: img.naturalWidth,
            height: img.naturalHeight
          },
          isDecorative: img.getAttribute('role') === 'presentation' || 
                       img.getAttribute('aria-hidden') === 'true',
        }));
      });

      // Analyze each image
      const results = await Promise.all(
        images.map(async (img: ImageData) => {
          const startTime = Date.now();
          const response = await fetch(img.url);
          const buffer = await response.arrayBuffer();
          const loadTime = Date.now() - startTime;
          const fileSize = buffer.byteLength / (1024 * 1024); // Convert to MB
          const format = img.url.split('.').pop()?.toLowerCase() || 'unknown';

          const issues: ImageIssue[] = [];

          // Check alt text
          if (!img.isDecorative && !img.altText) {
            issues.push({
              type: 'error',
              code: 'missing-alt',
              message: 'Image is missing alternative text',
              impact: 'high'
            });
          } else if (img.altText && img.altText.length > 125) {
            issues.push({
              type: 'warning',
              code: 'long-alt',
              message: 'Alternative text is too long (>125 characters)',
              impact: 'medium'
            });
          }

          // Check dimensions
          if (img.dimensions.width < 100 || img.dimensions.height < 100) {
            issues.push({
              type: 'warning',
              code: 'small-image',
              message: 'Image dimensions are smaller than recommended minimum size',
              impact: 'medium'
            });
          }

          // Check load time
          if (loadTime > 3000) {
            issues.push({
              type: 'warning',
              code: 'slow-load',
              message: 'Image load time exceeds 3 seconds',
              impact: 'medium'
            });
          }

          // Check file size
          if (fileSize > 1) {
            issues.push({
              type: 'warning',
              code: 'large-file',
              message: 'Image file size exceeds 1MB',
              impact: 'medium'
            });
          }

          // Check format
          if (!['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(format)) {
            issues.push({
              type: 'info',
              code: 'format-optimization',
              message: 'Consider using modern image formats (WebP, AVIF) for better compression',
              impact: 'low'
            });
          }

          return {
            ...img,
            loadTime,
            fileSize,
            format,
            issues
          };
        })
      );
      
      return NextResponse.json({ results });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error analyzing images:', error);
    return NextResponse.json(
      { error: 'Failed to analyze images' },
      { status: 500 }
    );
  }
} 