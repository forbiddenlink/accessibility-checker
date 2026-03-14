import { NextResponse } from "next/server";
import { chromium } from "@playwright/test";
import { DynamicContentAnalyzer } from "@/utils/dynamicContentAnalyzer";
import { validateUrl } from "@/utils/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const securityCheck = await validateUrl(url);
    if (!securityCheck.valid) {
      return NextResponse.json(
        { error: securityCheck.error || "Invalid Request" },
        { status: 400 },
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
        waitUntil: "networkidle",
        timeout: 30000,
      });

      const analyzer = new DynamicContentAnalyzer(page);
      const results = await analyzer.analyzeDynamicContent();

      return NextResponse.json({ results });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(
      "Dynamic content analysis error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Failed to analyze dynamic content" },
      { status: 500 },
    );
  }
}
