import { describe, it, expect, vi, afterEach } from "vitest";
import dns from "dns";
import { validateUrl, isBlockedAddress } from "./security";

describe("validateUrl", () => {
  describe("protocol validation", () => {
    it("rejects ftp protocol", async () => {
      const result = await validateUrl("ftp://example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Invalid protocol. Only HTTP and HTTPS are allowed.",
      );
    });

    it("rejects file protocol", async () => {
      const result = await validateUrl("file:///etc/passwd");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Invalid protocol. Only HTTP and HTTPS are allowed.",
      );
    });

    it("rejects javascript protocol", async () => {
      const result = await validateUrl("javascript:alert(1)");
      expect(result.valid).toBe(false);
    });

    it("rejects data protocol", async () => {
      const result = await validateUrl(
        "data:text/html,<script>alert(1)</script>",
      );
      expect(result.valid).toBe(false);
    });
  });

  describe("localhost blocking", () => {
    it("blocks localhost", async () => {
      const result = await validateUrl("http://localhost");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Access to localhost is denied.");
    });

    it("blocks localhost with port", async () => {
      const result = await validateUrl("http://localhost:3000");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Access to localhost is denied.");
    });

    it("blocks localhost with https", async () => {
      const result = await validateUrl("https://localhost");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Access to localhost is denied.");
    });

    it("blocks 127.0.0.1", async () => {
      const result = await validateUrl("http://127.0.0.1");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Access to localhost is denied.");
    });

    it("blocks 127.x.x.x variations", async () => {
      const result = await validateUrl("http://127.0.0.2");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Access to localhost is denied.");
    });

    it("blocks 127.255.255.255", async () => {
      const result = await validateUrl("http://127.255.255.255");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Access to localhost is denied.");
    });

    it("blocks [::1] IPv6 loopback", async () => {
      const result = await validateUrl("http://[::1]");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Access to localhost is denied.");
    });

    it("blocks 0.0.0.0", async () => {
      const result = await validateUrl("http://0.0.0.0");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Access to localhost is denied.");
    });
  });

  describe("invalid URL format", () => {
    it("rejects malformed URLs", async () => {
      const result = await validateUrl("not-a-url");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid URL format.");
    });

    it("rejects empty string", async () => {
      const result = await validateUrl("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid URL format.");
    });

    it("rejects URL with no host", async () => {
      const result = await validateUrl("http://");
      expect(result.valid).toBe(false);
    });

    it("rejects URLs with spaces", async () => {
      const result = await validateUrl("http://example .com");
      expect(result.valid).toBe(false);
    });
  });

  describe("DNS resolution and private IP blocking", () => {
    // These tests verify the DNS lookup error handling
    it("rejects unresolvable hostnames", async () => {
      // Using an invalid TLD that won't resolve
      const result = await validateUrl("http://thishostname.invalidtld123xyz");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Could not resolve hostname.");
    }, 10000); // Longer timeout for DNS
  });

  describe("literal private/reserved IP blocking", () => {
    // The metadata endpoints are the whole reason this check exists.
    it.each([
      ["http://169.254.169.254/latest/meta-data/", "cloud metadata"],
      ["http://169.254.170.2/v2/credentials", "ECS task credentials"],
    ])("blocks %s (%s)", async (url) => {
      const result = await validateUrl(url);
      expect(result.valid).toBe(false);
    });

    it.each([
      "http://10.0.0.1",
      "http://192.168.1.1",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://100.64.0.1", // CGNAT
      "http://198.18.0.1", // benchmarking
      "http://[fd00::1]", // unique-local
      "http://[fe80::1]", // link-local
      "http://[::ffff:169.254.169.254]", // IPv4-mapped metadata
    ])("blocks %s", async (url) => {
      const result = await validateUrl(url);
      expect(result.valid).toBe(false);
    });

    // The E2E spec asserts on these exact strings, and "localhost" would be
    // misleading wording for a private/link-local address.
    it("reports private-network wording for private literal IPs", async () => {
      const result = await validateUrl("http://192.168.1.1");
      expect(result.error).toBe(
        "Access to private network resources is denied.",
      );
    });

    it("reports private-network wording for the metadata IP", async () => {
      const result = await validateUrl("http://169.254.169.254");
      expect(result.error).toBe(
        "Access to private network resources is denied.",
      );
    });

    it("reports localhost wording for loopback literals", async () => {
      expect((await validateUrl("http://127.0.0.1")).error).toBe(
        "Access to localhost is denied.",
      );
    });

    it("allows a public literal IP", async () => {
      const result = await validateUrl("http://1.1.1.1");
      expect(result.valid).toBe(true);
      expect(result.addresses).toEqual(["1.1.1.1"]);
    });

    it("does not block a public address that merely starts with 172", async () => {
      // 172.15.x and 172.32.x sit outside the /12 and must stay allowed.
      expect((await validateUrl("http://172.15.0.1")).valid).toBe(true);
      expect((await validateUrl("http://172.32.0.1")).valid).toBe(true);
    });
  });

  describe("isBlockedAddress", () => {
    it("blocks the metadata address", () => {
      expect(isBlockedAddress("169.254.169.254")).toBe(true);
    });

    it("allows public addresses", () => {
      expect(isBlockedAddress("93.184.216.34")).toBe(false);
      expect(isBlockedAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(
        false,
      );
    });

    it("fails closed on anything that is not a literal IP", () => {
      expect(isBlockedAddress("example.com")).toBe(true);
      expect(isBlockedAddress("")).toBe(true);
    });
  });

  describe("DNS rebinding / multi-answer resolution", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("rejects a hostname resolving to both a public and a private address", async () => {
      vi.spyOn(dns, "lookup").mockImplementation(((
        _hostname: string,
        _options: unknown,
        cb: (err: NodeJS.ErrnoException | null, addresses: unknown) => void,
      ) => {
        cb(null, [
          { address: "93.184.216.34", family: 4 },
          { address: "169.254.169.254", family: 4 },
        ]);
      }) as unknown as typeof dns.lookup);

      const result = await validateUrl("http://rebind.example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Access to private network resources is denied.",
      );
    });

    it("returns every resolved address so callers can pin the connection", async () => {
      vi.spyOn(dns, "lookup").mockImplementation(((
        _hostname: string,
        _options: unknown,
        cb: (err: NodeJS.ErrnoException | null, addresses: unknown) => void,
      ) => {
        cb(null, [
          { address: "93.184.216.34", family: 4 },
          { address: "93.184.216.35", family: 4 },
        ]);
      }) as unknown as typeof dns.lookup);

      const result = await validateUrl("http://example.com");
      expect(result.valid).toBe(true);
      expect(result.addresses).toEqual(["93.184.216.34", "93.184.216.35"]);
    });
  });
});
