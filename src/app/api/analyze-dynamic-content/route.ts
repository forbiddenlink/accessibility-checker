import { NextResponse } from "next/server";
import { launchBrowser, createGuardedContext } from "@/utils/browser";
import { DynamicContentAnalyzer } from "@/utils/dynamicContentAnalyzer";
import { validateUrl } from "@/utils/security";
import { readUrlBody } from "@/utils/requestBody";

export const runtime = "nodejs";

// Chromium cold start (binary unpack + launch) exceeds the default limit.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readUrlBody(request);
    if (!body.ok) return body.response;
    const { url } = body;

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

    const browser = await launchBrowser();

    try {
      const context = await createGuardedContext(browser, {
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
