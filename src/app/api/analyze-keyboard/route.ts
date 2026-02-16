import { NextResponse } from 'next/server';
import { chromium } from '@playwright/test';
import { validateUrl } from '@/utils/security';
import { KeyboardNavigationAnalyzer } from '@/utils/keyboardNavigationAnalyzer';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const securityCheck = await validateUrl(url);
    if (!securityCheck.valid) {
      return NextResponse.json(
        { error: securityCheck.error || 'Invalid Request' },
        { status: 400 }
      );
    }

    const browser = await chromium.launch();

    try {
      const context = await browser.newContext({
        viewport: {
          width: 1280,
          height: 800,
        },
      });
      const page = await context.newPage();

      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      const analyzer = new KeyboardNavigationAnalyzer(page);
      const results = await analyzer.analyze();

      return NextResponse.json({ results });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Keyboard analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze keyboard navigation' },
      { status: 500 }
    );
  }
}
