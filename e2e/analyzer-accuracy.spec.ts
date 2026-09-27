import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * This app's core job is reporting axe-core violations accurately. The
 * website analyzer (src/utils/websiteAnalyzer.ts) runs axe with
 * runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }
 * against "body". This spec runs that exact configuration against a fixture
 * with 5 known violations and 3 known-good patterns, so a regression in the
 * axe-core version, the tag list, or the run target shows up as a failing
 * test instead of silently changing what gets reported to users.
 */
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

const EXPECTED_VIOLATIONS = [
  "aria-valid-attr-value", // <button aria-pressed="maybe">
  "color-contrast", // .low-contrast text
  "image-alt", // <img> with no alt
  "label", // <input> with no accessible name
  "link-name", // <a href> with no text
].sort();

const KNOWN_GOOD_SELECTORS = [
  ".good-contrast", // sufficient contrast text
  "#labelled-input", // input with an associated <label>
  'img[alt="A single decorative pixel used as a spacer"]', // properly described image
];

test("website analyzer reports exactly the known violations, no false positives or misses", async ({
  page,
}) => {
  const fixtureUrl =
    "file://" + path.join(process.cwd(), "e2e/fixtures/known-violations.html");
  await page.goto(fixtureUrl);
  await page.addScriptTag({ content: axeSource });

  const result = await page.evaluate(
    async (tags) => {
      const res = await (
        window as unknown as {
          axe: { run: (ctx: Document, opts: unknown) => Promise<unknown> };
        }
      ).axe.run(document, { runOnly: { type: "tag", values: tags } });
      return res as {
        violations: Array<{ id: string; nodes: Array<{ target: string[] }> }>;
      };
    },
    WCAG_TAGS as unknown as string[],
  );

  const foundIds = result.violations.map((v) => v.id).sort();
  expect(foundIds, "violation ids reported by axe").toEqual(
    EXPECTED_VIOLATIONS,
  );

  // No known-good element should appear as a target on any violation.
  const flaggedTargets = result.violations.flatMap((v) =>
    v.nodes.flatMap((n) => n.target),
  );
  for (const goodSelector of KNOWN_GOOD_SELECTORS) {
    expect(
      flaggedTargets,
      `known-good element ${goodSelector} was incorrectly flagged`,
    ).not.toContain(goodSelector);
  }
});
