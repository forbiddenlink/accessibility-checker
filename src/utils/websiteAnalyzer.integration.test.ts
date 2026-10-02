// @vitest-environment node
import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { WebsiteAnalyzer } from "./websiteAnalyzer";
import { AnalysisFailedError } from "./analysisErrors";

/**
 * Runs the REAL analyzer (Chromium + axe-core injection) against a page
 * served from localhost. This is the test that would have caught the
 * `require.resolve` regression: every other test mocks the analyzer, so a
 * scan that silently returned "0 pages, 0 violations" passed CI.
 *
 * The SSRF guard blocks localhost on purpose, so these tests hand the
 * analyzer a plain context through its `createContext` option. The API route
 * never passes that option, so production always uses the guarded context.
 */
const PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7";

const PAGES: Record<string, string> = {
  "/": `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fixture</title></head>
    <body><main><h1>Fixture</h1><img src="${PIXEL}"></main></body></html>`,
  "/clean": `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Clean</title></head>
    <body><main><h1>Clean</h1><img src="${PIXEL}" alt="A single pixel"></main></body></html>`,
  "/with-links": `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Links</title></head>
    <body><main><h1>Links</h1><a href="/clean">Clean page</a></main></body></html>`,
};

let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const html = PAGES[req.url ?? "/"];
    res.writeHead(html ? 200 : 404, { "content-type": "text/html" });
    res.end(html ?? "not found");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const analyzer = () =>
  new WebsiteAnalyzer({ createContext: (browser) => browser.newContext() });

describe("WebsiteAnalyzer against a real page", () => {
  it("finds the known violation (img without alt) on exactly one page", async () => {
    const result = await analyzer().analyzeWebsite(`${base}/`);

    expect(result.pages).toHaveLength(1);
    expect(result.failedPages).toEqual([]);
    expect(result.totalViolations).toBeGreaterThan(0);
    const ids = result.pages[0]?.accessibility.violations.map((v) => v.id);
    expect(ids).toContain("image-alt");
    expect(result.totalPasses).toBeGreaterThan(0);
  }, 60_000);

  it("reports a clean page as clean", async () => {
    const result = await analyzer().analyzeWebsite(`${base}/clean`);
    expect(result.pages).toHaveLength(1);
    expect(result.totalViolations).toBe(0);
    expect(result.totalPasses).toBeGreaterThan(0);
  }, 60_000);

  it("crawls same-site links and counts each page once", async () => {
    const result = await analyzer().analyzeWebsite(`${base}/with-links`);
    expect(result.pages.map((p) => p.path).sort()).toEqual([
      "/clean",
      "/with-links",
    ]);
  }, 60_000);

  it("throws instead of returning an empty clean result when no page loads", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const dead = http.createServer().listen(0, "127.0.0.1");
    await new Promise((resolve) => dead.once("listening", resolve));
    const port = (dead.address() as AddressInfo).port;
    await new Promise((resolve) => dead.close(resolve)); // port now refuses

    const error = await analyzer()
      .analyzeWebsite(`http://127.0.0.1:${port}/`)
      .catch((e: unknown) => e);
    quiet.mockRestore();

    expect(error).toBeInstanceOf(AnalysisFailedError);
    const failed = (error as AnalysisFailedError).failedPages;
    expect(failed).toHaveLength(1);
    expect(failed[0]?.reason).toMatch(/ERR_CONNECTION_REFUSED/);
    expect(failed[0]?.reason).not.toContain("\n");
  }, 60_000);

  it("reports a failing linked page instead of counting it as clean", async () => {
    PAGES["/with-bad-link"] =
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Bad link</title></head>
      <body><main><h1>Bad link</h1><a href="/clean">ok</a></main></body></html>`;
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const a = analyzer();
    const original = (
      a as unknown as {
        analyzePage: (p: unknown, u: string, t: number) => Promise<unknown>;
      }
    ).analyzePage.bind(a);
    (a as unknown as { analyzePage: typeof original }).analyzePage = async (
      p,
      u,
      t,
    ) => {
      if (u.endsWith("/clean")) throw new Error("injected failure");
      return original(p, u, t);
    };

    const result = await a.analyzeWebsite(`${base}/with-bad-link`);
    quiet.mockRestore();
    delete PAGES["/with-bad-link"];

    expect(result.pages.map((p) => p.path)).toEqual(["/with-bad-link"]);
    expect(result.failedPages).toEqual([
      { url: `${base}/clean`, reason: "injected failure" },
    ]);
  }, 60_000);
});
