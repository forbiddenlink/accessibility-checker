import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { DynamicContentAnalyzer } from '@/utils/dynamicContentAnalyzer';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({
        width: 1280,
        height: 800,
      });

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Initialize analyzer
      const analyzer = new DynamicContentAnalyzer(page);
      
      // Analyze dynamic content
      const results = await analyzer.analyzeDynamicContent();

      return NextResponse.json({ results });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Dynamic content analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze dynamic content' },
      { status: 500 }
    );
  }
} 