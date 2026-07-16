import arcjet, { shield, detectBot } from "@arcjet/next";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const arcjetKey = process.env.ARCJET_KEY;

if (!arcjetKey && process.env.NODE_ENV === "production") {
  // `key!` used to hide this: the assertion is erased at compile time, so an
  // undefined key reached Arcjet, the call failed, and Arcjet fails open —
  // production served every request with no protection and said nothing.
  console.error(
    "ARCJET_KEY is not set: shield and bot detection are disabled for /api/*",
  );
}

/**
 * The documented public API. Bot detection must NOT apply here: every
 * legitimate consumer of a JSON API is a bot by Arcjet's definition, so
 * detectBot rejected curl, fetch and every script while letting browsers
 * through — the exact inverse of what a public API is for.
 */
const publicApi = arcjetKey
  ? arcjet({ key: arcjetKey, rules: [shield({ mode: "LIVE" })] })
  : null;

/**
 * The analyzer routes each spawn a headless browser, so they are worth
 * defending harder. They are only ever called from this app's own UI.
 */
const browserOnlyApi = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: "LIVE" }),
        detectBot({ mode: "LIVE", allow: ["CATEGORY:SEARCH_ENGINE"] }),
      ],
    })
  : null;

const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const publicApiLimit = redisConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "10 s"),
      analytics: true,
      prefix: "rl:api",
    })
  : null;

// An analyzer request costs a browser launch, so it gets a far smaller budget
// than the pure-maths endpoints.
const analyzerLimit = redisConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "rl:analyze",
    })
  : null;

function clientIp(request: NextRequest): string {
  // Prefer the platform-set header: x-forwarded-for is client-supplied, so on
  // any host that does not normalise it a caller can mint a fresh bucket per
  // request just by varying the header.
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

export async function middleware(request: NextRequest) {
  const isAnalyzer = request.nextUrl.pathname.startsWith("/api/analyze-");

  const limiter = isAnalyzer ? analyzerLimit : publicApiLimit;
  if (limiter) {
    const { success, limit, reset } = await limiter.limit(clientIp(request));
    if (!success) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        {
          status: 429,
          headers: {
            "RateLimit-Limit": String(limit),
            "RateLimit-Reset": String(reset),
            "Retry-After": String(
              Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
            ),
          },
        },
      );
    }
  }

  const aj = isAnalyzer ? browserOnlyApi : publicApi;
  if (aj) {
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
