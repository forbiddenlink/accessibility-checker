import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const limit = vi.hoisted(() => vi.fn());

vi.mock("@arcjet/next", () => ({
  default: () => ({ protect: async () => ({ isDenied: () => false }) }),
  shield: () => ({}),
  detectBot: () => ({}),
}));
vi.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => ({}) } }));
vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow() {
      return {};
    }
    limit = limit;
  }
  return { Ratelimit };
});

describe("middleware rate limit timeout", () => {
  beforeEach(() => {
    vi.resetModules();
    limit.mockReset();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.invalid";
    process.env.UPSTASH_REDIS_REST_TOKEN = "x";
  });

  const run = async (path: string) => {
    const { middleware } = await import("./middleware");
    return middleware(new NextRequest(`https://example.com${path}`));
  };

  it("fails closed with 503 on analyzer routes when the limiter times out", async () => {
    limit.mockResolvedValue({
      success: true,
      reason: "timeout",
      limit: 5,
      reset: 0,
    });
    expect((await run("/api/analyze-forms")).status).toBe(503);
  });

  it("keeps the cheap public API fail-open on timeout", async () => {
    limit.mockResolvedValue({
      success: true,
      reason: "timeout",
      limit: 20,
      reset: 0,
    });
    expect((await run("/api/contrast")).status).toBe(200);
  });

  it("still returns 429 over the limit", async () => {
    limit.mockResolvedValue({
      success: false,
      limit: 5,
      reset: Date.now() + 1000,
    });
    expect((await run("/api/analyze-forms")).status).toBe(429);
  });
});
