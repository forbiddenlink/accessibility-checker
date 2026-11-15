import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists the public pages, not just home and api docs", () => {
    const paths = sitemap().map((e) => new URL(e.url).pathname.replace(/\/$/, ""));
    for (const p of ["", "/screenshot", "/privacy", "/terms"]) {
      expect(paths).toContain(p);
    }
  });
});
