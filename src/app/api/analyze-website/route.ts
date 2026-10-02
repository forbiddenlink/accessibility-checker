import { NextResponse } from "next/server";
import { WebsiteAnalyzer } from "@/utils/websiteAnalyzer";
import { validateUrl } from "@/utils/security";
import { readUrlBody } from "@/utils/requestBody";
import { AnalysisFailedError } from "@/utils/analysisErrors";

export const runtime = "nodejs"; // Force Node.js runtime instead of Edge

// Chromium cold start (binary unpack + launch) exceeds the default limit.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readUrlBody(request);
    if (!body.ok) return body.response;
    const { url } = body;

    // Security Check: SSRF Prevention
    const securityCheck = await validateUrl(url);
    if (!securityCheck.valid) {
      return NextResponse.json(
        { error: securityCheck.error || "Invalid Request" },
        { status: 400 },
      );
    }

    const analyzer = new WebsiteAnalyzer();
    const results = await analyzer.analyzeWebsite(url);

    return NextResponse.json({ results });
  } catch (error) {
    // Zero analyzable pages is a failed scan, never a clean one: an empty 200
    // reads as "no violations" in a tool whose whole job is to find them.
    if (error instanceof AnalysisFailedError) {
      return NextResponse.json(
        { error: error.message, failedPages: error.failedPages },
        { status: 502 },
      );
    }
    console.error(
      "Error analyzing website:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 500 },
    );
  }
}
