import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import { scrubEvent } from "./sentry-scrub";

describe("scrubEvent", () => {
  it("strips request details and query strings from every URL Sentry would send", () => {
    const out = scrubEvent({
      type: undefined,
      transaction: "/api/analyze-website?url=SECRET1",
      message: "failed https://u:SECRET2@x.test/p?k=SECRET3 now",
      exception: {
        values: [
          {
            type: "Error",
            value: "page.goto: https://x.test/a?token=SECRET4 timed out",
          },
        ],
      },
      request: {
        url: "https://app.test/api?u=SECRET5",
        cookies: { a: "SECRET6" },
        headers: { a: "SECRET6" },
        data: "SECRET6",
        query_string: "SECRET5",
      },
      breadcrumbs: [
        {
          category: "fetch",
          data: { url: "https://x.test/api?token=SECRET7", method: "POST" },
        },
      ],
      spans: [
        {
          description: "GET https://x.test/a?q=SECRET8",
          data: {
            "http.url": "https://x.test/a?q=SECRET8",
            "http.query": "q=SECRET8",
          },
        },
      ],
    } as unknown as ErrorEvent);
    expect(JSON.stringify(out)).not.toMatch(/SECRET/);
    expect(out.exception?.values?.[0].value).toBe(
      "page.goto: https://x.test/a timed out",
    );
    expect(out.request).toEqual({ url: "https://app.test/api" });
  });
});
