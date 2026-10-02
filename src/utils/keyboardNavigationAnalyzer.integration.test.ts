// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { launchBrowser } from "./browser";
import { KeyboardNavigationAnalyzer } from "./keyboardNavigationAnalyzer";

/**
 * Runs the real analyzer in real Chromium. A jsdom test cannot cover this:
 * :focus-visible and computed focus styles only exist in a browser engine.
 */
const FOCUS_ISSUE = "Element lacks visible focus indicator";

const page = (css: string) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><title>Focus fixture</title><style>${css}</style></head>
<body><a href="#main">Skip to main</a>
<main id="main"><a href="/one">One</a> <button type="button">Two</button>
<input aria-label="Three" /></main></body></html>`;

const GOOD_RING_CSS = `
  a:focus-visible, button:focus-visible, input:focus-visible {
    outline: 3px solid #005fcc; outline-offset: 2px;
  }`;
const GOOD_RING = page(GOOD_RING_CSS);

// The WCAG 2.4.7 failure: outline removed, and the only box-shadow is a
// decorative one that is there whether or not the element has focus.
const NO_INDICATOR = page(`
  a, button, input { outline: none; box-shadow: 0 1px 2px rgba(0,0,0,.3); }`);

const SHADOW_ON_FOCUS = page(`
  a, button, input { outline: none; }
  a:focus-visible, button:focus-visible, input:focus-visible {
    box-shadow: 0 0 0 3px #005fcc;
  }`);

const FADE_IN_RING = page(`
  a, button, input { outline: 3px solid transparent; transition: outline-color 1s; }
  a:focus-visible, button:focus-visible, input:focus-visible { outline-color: #005fcc; }`);

describe("KeyboardNavigationAnalyzer focus indicator (WCAG 2.4.7)", () => {
  let browser: Browser;
  let tab: Page;

  beforeAll(async () => {
    browser = await launchBrowser();
    tab = await browser.newPage();
  }, 60_000);

  afterAll(async () => {
    await browser.close();
  });

  async function analyze(html: string) {
    await tab.setContent(html);
    return new KeyboardNavigationAnalyzer(tab).analyze();
  }

  const focusIssues = (r: Awaited<ReturnType<typeof analyze>>) =>
    r.issues.filter((i) => i.message === FOCUS_ISSUE);

  it("does not flag a page with a good :focus-visible ring", async () => {
    const result = await analyze(GOOD_RING);
    expect(focusIssues(result)).toHaveLength(0);
    expect(result.focusableElements.length).toBeGreaterThanOrEqual(4);
    expect(result.focusableElements.every((e) => e.hasVisibleFocus)).toBe(true);
  });

  it("flags outline:none with only a decorative always-on box-shadow", async () => {
    const result = await analyze(NO_INDICATOR);
    expect(focusIssues(result)).toHaveLength(4);
    expect(result.focusableElements.every((e) => !e.hasVisibleFocus)).toBe(
      true,
    );
  });

  it("accepts a box-shadow that appears on focus", async () => {
    const result = await analyze(SHADOW_ON_FOCUS);
    expect(focusIssues(result)).toHaveLength(0);
  });

  it("sees a ring that fades in via a transition", async () => {
    const result = await analyze(FADE_IN_RING);
    expect(focusIssues(result)).toHaveLength(0);
  });

  it("falls back to the browser default ring when the page styles nothing", async () => {
    const result = await analyze(page(""));
    expect(focusIssues(result)).toHaveLength(0);
  });

  it("ignores disabled controls, which are not in the tab order", async () => {
    const result = await analyze(
      page(GOOD_RING_CSS).replace(
        "<input",
        "<button disabled>Off</button><input",
      ),
    );
    expect(focusIssues(result)).toHaveLength(0);
    expect(result.focusableElements.map((e) => e.text)).not.toContain("Off");
  });
});
