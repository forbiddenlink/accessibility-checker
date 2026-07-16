import { NextResponse } from "next/server";
import { launchBrowser, createGuardedContext } from "@/utils/browser";
import { ImageAnalyzer } from "@/utils/imageAnalyzer";
import { validateUrl } from "@/utils/security";

export const runtime = "nodejs";

// Chromium cold start (binary unpack + launch) exceeds the default limit.
export const maxDuration = 60;

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

    const browser = await launchBrowser();

    try {
      const context = await createGuardedContext(browser);
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const analyzer = new ImageAnalyzer(page);
      const results = await analyzer.analyzeImages();

      return NextResponse.json({ results });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(
      "Error analyzing images:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Failed to analyze images" },
      { status: 500 },
    );
  }
}
