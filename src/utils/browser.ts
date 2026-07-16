import dns from "dns";
import { promisify } from "util";
import chromiumPack from "@sparticuz/chromium";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
} from "playwright-core";
import { isBlockedAddress } from "./security";

const lookup = (hostname: string) =>
  promisify(dns.lookup)(hostname, { all: true }) as Promise<
    Array<{ address: string }>
  >;

/**
 * Vercel/Lambda ship no Chromium binary, so the serverless build needs the
 * @sparticuz pack. Locally and in CI, Playwright's own install is used.
 */
const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION,
);

export async function launchBrowser(): Promise<Browser> {
  if (isServerless) {
    // The analyzers only read the DOM, so skip the WebGL/swiftshader
    // stack: it avoids extracting swiftshader.tar.br into /tmp, which is
    // both a cold-start cost and a scarce resource on Lambda.
    chromiumPack.setGraphicsMode = false;

    return chromium.launch({
      args: chromiumPack.args,
      executablePath: await chromiumPack.executablePath(),
      headless: true,
    });
  }

  return chromium.launch({ channel: "chromium", headless: true });
}

const resolutionCache = new Map<string, boolean>();

async function hostResolvesSomewhereBlocked(
  hostname: string,
): Promise<boolean> {
  const cached = resolutionCache.get(hostname);
  if (cached !== undefined) return cached;

  let blocked: boolean;
  try {
    const addresses = await lookup(hostname);
    blocked =
      addresses.length === 0 ||
      addresses.some(({ address }) => isBlockedAddress(address));
  } catch {
    blocked = true; // unresolvable — fail closed
  }

  resolutionCache.set(hostname, blocked);
  return blocked;
}

/**
 * A context that re-checks the destination of every request the page makes.
 *
 * Validating only the URL the user submitted is not enough: the page can 302
 * to 169.254.169.254, and every crawled link and subresource is a fresh
 * request that never passed validateUrl. Enforcing at request time is the only
 * place that sees where the browser is *actually* about to go, which also
 * closes the DNS-rebinding window between validation and fetch.
 */
export async function createGuardedContext(
  browser: Browser,
  options?: BrowserContextOptions,
): Promise<BrowserContext> {
  const context = await browser.newContext(options);

  await context.route("**/*", async (route) => {
    let hostname: string;
    let protocol: string;
    try {
      const parsed = new URL(route.request().url());
      hostname = parsed.hostname;
      protocol = parsed.protocol;
    } catch {
      return route.abort("blockedbyclient");
    }

    // data:/blob: never touch the network.
    if (protocol !== "http:" && protocol !== "https:") {
      if (protocol === "data:" || protocol === "blob:") return route.continue();
      return route.abort("blockedbyclient");
    }

    if (await hostResolvesSomewhereBlocked(hostname)) {
      return route.abort("blockedbyclient");
    }

    return route.continue();
  });

  return context;
}
