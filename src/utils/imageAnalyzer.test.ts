import { describe, it, expect } from "vitest";
import { parseImageFormat } from "./imageAnalyzer";

describe("parseImageFormat", () => {
  it("parses the MIME subtype out of a data: URI", () => {
    expect(
      parseImageFormat(
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7",
      ),
    ).toBe("gif");
  });

  it("parses png data URIs", () => {
    expect(
      parseImageFormat(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      ),
    ).toBe("png");
  });

  it("strips SVG parameters from a data: URI mime type", () => {
    expect(parseImageFormat("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(
      "svg",
    );
  });

  it("falls back to unknown for a data: URI with no parseable mime type", () => {
    expect(parseImageFormat("data:;base64,AAAA")).toBe("unknown");
  });

  it("falls back to the file extension for a normal URL", () => {
    expect(parseImageFormat("https://example.com/photo.jpg")).toBe("jpg");
  });

  it("is case-insensitive and strips a query string for a normal URL", () => {
    expect(parseImageFormat("https://example.com/photo.JPG?w=200&h=100")).toBe(
      "jpg",
    );
  });

  it("returns unknown for a normal URL with no extension", () => {
    expect(parseImageFormat("https://example.com/photo")).toBe("unknown");
  });
});
