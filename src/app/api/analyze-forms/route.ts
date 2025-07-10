import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { FormAnalyzer } from '@/utils/formAnalyzer';

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
      const analyzer = new FormAnalyzer(page);
      
      // Analyze forms
      const results = await analyzer.analyzeForms();

      return NextResponse.json({ results });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Form analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze forms' },
      { status: 500 }
    );
  }
} 