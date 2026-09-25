import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * The product audits other people's pages for WCAG failures, so its own pages
 * have to hold the same line. Before this suite existed the homepage shipped
 * two serious contrast failures, two unlabelled selects, and three URL inputs
 * rendering #f5f5f5 text on a white background — invisible as you typed.
 *
 * axe-core is already a runtime dependency, so this injects that exact build
 * rather than adding an @axe-core/playwright wrapper.
 */
// Playwright compiles specs to CommonJS, so import.meta is unavailable here.
// axe-core is a direct dependency, which pnpm links at the top level.
const axeSource = fs.readFileSync(
  path.join(process.cwd(), "node_modules/axe-core/axe.min.js"),
  "utf8",
);

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

const ROUTES = ["/", "/privacy", "/terms", "/screenshot"];

interface AxeNode {
  target: string[];
  failureSummary?: string;
}
interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: AxeNode[];
}

for (const route of ROUTES) {
  test(`${route} has no WCAG 2.2 AA violations`, async ({
    page,
    browserName,
  }) => {
    // Colour-contrast results depend on how the engine rasterises text, and the
    // accessibility tree differs per engine. One engine keeps the gate honest.
    test.skip(
      browserName !== "chromium",
      "axe is run once, on Chromium, to keep results comparable",
    );

    await page.goto(route);
    // The analyser panels are client components that only exist after
    // hydration. Without this wait axe scans the server shell and reports a
    // clean page while three invisible-text inputs sit one tick away.
    await page.waitForLoadState("networkidle");
    await page.addScriptTag({ content: axeSource });

    const violations = await page.evaluate(
      async (tags) => {
        const result = await (
          window as unknown as {
            axe: { run: (ctx: Document, opts: unknown) => Promise<unknown> };
          }
        ).axe.run(document, { runOnly: { type: "tag", values: tags } });
        return (result as { violations: AxeViolation[] }).violations;
      },
      WCAG_TAGS as unknown as string[],
    );

    const report = violations
      .map(
        (v) =>
          `${v.impact} [${v.id}] ${v.help}\n` +
          v.nodes.map((n) => `    ${n.target.join(" ")}`).join("\n"),
      )
      .join("\n");

    expect(report, `${route} accessibility violations:\n${report}`).toBe("");
  });
}
