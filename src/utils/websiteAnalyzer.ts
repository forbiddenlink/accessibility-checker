import axe from "axe-core";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { launchBrowser, createGuardedContext } from "./browser";
import { AccessibilityTestResult } from "./accessibilityTesting";
import { AnalysisFailedError, type FailedPage } from "./analysisErrors";

export type { FailedPage };

export interface WebsiteAnalysisResult {
  url: string;
  pages: PageAnalysisResult[];
  totalViolations: number;
  totalPasses: number;
  commonIssues: string[];
  /** Pages that could not be analyzed. They are NOT counted as clean. */
  failedPages: FailedPage[];
}

/** First line only, so Playwright call logs and stack frames never reach a client. */
function failureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const firstLine = (message.split("\n")[0] ?? "").replace(/^[\w.]+: /, "");
  return firstLine.slice(0, 200) || "Unknown error";
}

export interface WebsiteAnalyzerOptions {
  /**
   * Builds the browsing context. Defaults to the SSRF-guarded context, which
   * is the only thing the API route ever uses. Integration tests override it
   * to scan a fixture served from localhost, which the guard rightly blocks.
   */
  createContext?: (browser: Browser) => Promise<BrowserContext>;
}

export interface PageAnalysisResult {
  path: string;
  accessibility: AccessibilityTestResult;
  loadTime: number;
  resources: {
    images: number;
    scripts: number;
    stylesheets: number;
  };
}

export class WebsiteAnalyzer {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private visitedUrls: Set<string> = new Set();
  private maxPages: number = 10;
  private createContext: (browser: Browser) => Promise<BrowserContext>;

  constructor(options: WebsiteAnalyzerOptions = {}) {
    this.createContext = options.createContext ?? createGuardedContext;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await launchBrowser();
      this.context = await this.createContext(this.browser);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
    this.visitedUrls.clear();
  }

  private async crawlPage(
    currentUrl: string,
    baseUrl: string,
  ): Promise<string[]> {
    if (!this.context) throw new Error("Browser context not initialized");

    const page = await this.context.newPage();
    const newUrls: string[] = [];

    try {
      await page.goto(currentUrl, { waitUntil: "networkidle", timeout: 30000 });
      this.visitedUrls.add(currentUrl);

      // Get all links on the page
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.getAttribute("href"))
          .filter(
            (href) =>
              href && !href.startsWith("#") && !href.startsWith("mailto:"),
          )
          .map((href) => new URL(href!, window.location.href).href);
      });

      // Filter links to only include those from the same domain
      const baseUrlObj = new URL(baseUrl);
      newUrls.push(
        ...links.filter((url) => {
          try {
            const urlObj = new URL(url);
            return (
              urlObj.hostname === baseUrlObj.hostname &&
              !this.visitedUrls.has(url)
            );
          } catch {
            return false;
          }
        }),
      );
    } finally {
      await page.close();
    }

    return newUrls;
  }

  private async analyzePage(
    page: Page,
    url: string,
    startTime: number,
  ): Promise<PageAnalysisResult> {
    // Wait for network idle
    await page.waitForLoadState("networkidle");

    // Inject axe-core as source text. `require.resolve` is rewritten to a
    // numeric module id by the Next bundler, so a `path:` injection throws on
    // every page in a built app. `axe.source` needs no file on disk, but it is
    // only valid while axe-core stays external (see next.config.js).
    await page.addScriptTag({ content: axe.source });
    if (!(await page.evaluate(() => "axe" in window))) {
      // Never run the scan on a page without axe: that is how a broken
      // injection turned into a clean report.
      throw new Error("axe-core failed to load in the page");
    }

    // Run accessibility tests inside the page
    const accessibilityResults = await page.evaluate(async () => {
      // @ts-ignore
      // WCAG 2.2 Level A/AA rules ship disabled by default in axe-core
      // until the standard sees wider regulatory adoption, so they must be
      // requested explicitly or this scan silently misses current-spec
      // issues (e.g. target-size) even though WCAG 2.2 is the live
      // standard. See https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
      const results = await window.axe.run("body", {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      });

      return {
        violations: results.violations.map((v: any) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n: any) => n.html),
          help: v.help,
          helpUrl: v.helpUrl,
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
      };
    });

    // Get resource counts
    const resources = await page.evaluate(() => ({
      images: document.getElementsByTagName("img").length,
      scripts: document.getElementsByTagName("script").length,
      stylesheets: document.getElementsByTagName("link").length,
    }));

    return {
      path: new URL(url).pathname,
      accessibility: accessibilityResults,
      loadTime: Date.now() - startTime,
      resources,
    };
  }

  async analyzeWebsite(url: string): Promise<WebsiteAnalysisResult> {
    await this.initialize();
    const pages: PageAnalysisResult[] = [];
    const urlsToVisit = [url];
    let totalViolations = 0;
    let totalPasses = 0;
    const issueFrequency: Map<string, number> = new Map();
    const failedPages: FailedPage[] = [];

    try {
      while (urlsToVisit.length > 0 && pages.length < this.maxPages) {
        const currentUrl = urlsToVisit.shift()!;

        if (!this.visitedUrls.has(currentUrl)) {
          // Mark visited up front so a page that fails is not re-queued from
          // every other page that links to it.
          this.visitedUrls.add(currentUrl);
          const page = await this.context!.newPage();
          const startTime = Date.now();

          try {
            await page.goto(currentUrl, {
              waitUntil: "networkidle",
              timeout: 30000,
            });
            const pageResult = await this.analyzePage(
              page,
              currentUrl,
              startTime,
            );
            pages.push(pageResult);

            // Update statistics
            totalViolations += pageResult.accessibility.violations.length;
            totalPasses += pageResult.accessibility.passes;

            // Track issue frequency
            pageResult.accessibility.violations.forEach((violation) => {
              const count = issueFrequency.get(violation.id) || 0;
              issueFrequency.set(violation.id, count + 1);
            });
          } catch (error) {
            console.error(`Error analyzing ${currentUrl}:`, error);
            failedPages.push({ url: currentUrl, reason: failureReason(error) });
            continue;
          } finally {
            await page.close();
          }

          // Link discovery is best-effort: a page that was analyzed stays
          // analyzed even if collecting its links fails.
          try {
            urlsToVisit.push(...(await this.crawlPage(currentUrl, url)));
          } catch (error) {
            console.error(`Error collecting links from ${currentUrl}:`, error);
          }
        }
      }

      if (pages.length === 0) {
        throw new AnalysisFailedError(
          "Could not analyze any page on this site.",
          failedPages,
        );
      }

      // Get most common issues
      const commonIssues = Array.from(issueFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => `${id} (found ${count} times)`);

      return {
        url,
        pages,
        totalViolations,
        totalPasses,
        commonIssues,
        failedPages,
      };
    } finally {
      await this.cleanup();
    }
  }
}
