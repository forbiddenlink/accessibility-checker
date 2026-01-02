import { NextResponse } from 'next/server';
import { WebsiteAnalyzer } from '@/utils/websiteAnalyzer';
import { validateUrl } from '@/utils/security';

export const runtime = 'nodejs'; // Force Node.js runtime instead of Edge

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // Security Check: SSRF Prevention
    const securityCheck = await validateUrl(url);
    if (!securityCheck.valid) {
      return NextResponse.json(
        { error: securityCheck.error || 'Invalid Request' },
        { status: 400 }
      );
    }

    const analyzer = new WebsiteAnalyzer();
    const results = await analyzer.analyzeWebsite(url);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    );
  }
} 