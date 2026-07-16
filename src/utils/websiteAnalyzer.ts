import type { Browser, BrowserContext, Page } from "playwright-core";
import { launchBrowser, createGuardedContext } from "./browser";
import { AccessibilityTestResult } from "./accessibilityTesting";

export interface WebsiteAnalysisResult {
  url: string;
  pages: PageAnalysisResult[];
  totalViolations: number;
  totalPasses: number;
  commonIssues: string[];
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

  async initialize() {
    if (!this.browser) {
      this.browser = await launchBrowser();
      this.context = await createGuardedContext(this.browser);
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

    // Inject axe-core
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });

    // Run accessibility tests inside the page
    const accessibilityResults = await page.evaluate(async () => {
      // @ts-ignore
      const results = await window.axe.run("body", {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
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

    try {
      while (urlsToVisit.length > 0 && pages.length < this.maxPages) {
        const currentUrl = urlsToVisit.shift()!;

        if (!this.visitedUrls.has(currentUrl)) {
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

            // Get new URLs to visit
            const newUrls = await this.crawlPage(currentUrl, url);
            urlsToVisit.push(...newUrls);
          } catch (error) {
            console.error(`Error analyzing ${currentUrl}:`, error);
          } finally {
            await page.close();
          }
        }
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
      };
    } finally {
      await this.cleanup();
    }
  }
}
