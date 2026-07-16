import dns from "dns";
import net from "net";
import { promisify } from "util";

// Resolved through `dns.lookup` at call time rather than promisified once at
// module scope, so the binding stays swappable under test.
const lookupAll = (hostname: string) =>
  promisify(dns.lookup)(hostname, { all: true }) as Promise<
    Array<{ address: string }>
  >;

export const LOCALHOST_DENIED = "Access to localhost is denied.";
export const PRIVATE_DENIED = "Access to private network resources is denied.";
export const PROTOCOL_DENIED =
  "Invalid protocol. Only HTTP and HTTPS are allowed.";
export const UNRESOLVABLE = "Could not resolve hostname.";
export const MALFORMED = "Invalid URL format.";

/**
 * IPv4 ranges that must never be reachable from a user-supplied URL.
 * 169.254/16 is the one that matters most: it holds the cloud metadata
 * endpoints (169.254.169.254, and 169.254.170.2 for ECS task credentials).
 */
const BLOCKED_V4: ReadonlyArray<[string, number]> = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // RFC1918 private
  ["100.64.0.0", 10], // RFC6598 CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local — cloud metadata
  ["172.16.0.0", 12], // RFC1918 private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // RFC1918 private
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved / broadcast
];

function v4ToInt(address: string): number {
  return address
    .split(".")
    .reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0);
}

function isBlockedV4(address: string): boolean {
  const ip = v4ToInt(address);
  return BLOCKED_V4.some(([base, bits]) => {
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return (ip & mask) === (v4ToInt(base) & mask);
  });
}

function isBlockedV6(address: string): boolean {
  const addr = address.toLowerCase().split("%")[0]; // strip zone index

  // IPv4-mapped addresses tunnel straight past a v6-only check, so re-test
  // the embedded v4 address. Both spellings must be handled: the dotted form
  // (::ffff:169.254.169.254) and the hex form it normalizes to
  // (::ffff:a9fe:a9fe) — `new URL()` rewrites the former into the latter.
  const dotted = addr.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted?.[1]) return isBlockedV4(dotted[1]);

  const hex = addr.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex?.[1] && hex[2]) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    const v4 = [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
    return isBlockedV4(v4);
  }

  if (addr === "::" || addr === "::1") return true; // unspecified, loopback
  if (/^f[cd]/.test(addr)) return true; // fc00::/7 unique-local
  if (/^fe[89ab]/.test(addr)) return true; // fe80::/10 link-local
  if (/^ff/.test(addr)) return true; // ff00::/8 multicast
  return false;
}

/**
 * True when an already-resolved IP address points somewhere a user-supplied
 * URL must not reach. Exported so request interception can re-check the IP a
 * redirect actually lands on, which is where validate-then-fetch leaks.
 */
export function isBlockedAddress(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) return isBlockedV4(address);
  if (version === 6) return isBlockedV6(address);
  return true; // not a literal IP — fail closed
}

/**
 * Loopback / unspecified addresses, which get the "localhost" wording rather
 * than the "private network" wording. Both are denied either way.
 */
function isLoopbackLiteral(address: string): boolean {
  if (net.isIP(address) === 4) {
    return address.startsWith("127.") || address === "0.0.0.0";
  }
  const addr = address.toLowerCase();
  if (addr === "::1" || addr === "::") return true;
  const mapped = addr.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  return mapped?.[1] ? isLoopbackLiteral(mapped[1]) : false;
}

export interface UrlValidation {
  valid: boolean;
  error?: string;
  /** Every address the hostname resolved to, for connection pinning. */
  addresses?: string[];
}

export async function validateUrl(urlString: string): Promise<UrlValidation> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: MALFORMED };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { valid: false, error: PROTOCOL_DENIED };
  }

  if (!url.hostname) {
    return { valid: false, error: MALFORMED };
  }

  // Literal-hostname blocklist. Kept separate from the resolved-IP check so
  // the user-facing message distinguishes "you typed localhost" from
  // "that name resolves somewhere internal".
  const hostname = url.hostname.toLowerCase();
  const bracketless = hostname.replace(/^\[|\]$/g, "");

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return { valid: false, error: LOCALHOST_DENIED };
  }

  if (net.isIP(bracketless)) {
    if (isLoopbackLiteral(bracketless)) {
      return { valid: false, error: LOCALHOST_DENIED };
    }
    if (isBlockedAddress(bracketless)) {
      return { valid: false, error: PRIVATE_DENIED };
    }
    // A literal IP needs no DNS round-trip.
    return { valid: true, addresses: [bracketless] };
  }

  let resolved: Array<{ address: string }>;
  try {
    resolved = await lookupAll(hostname);
  } catch {
    return { valid: false, error: UNRESOLVABLE };
  }

  if (!resolved.length) {
    return { valid: false, error: UNRESOLVABLE };
  }

  // Every answer must be safe. A name resolving to one public and one
  // private address is a rebinding attempt, not a valid target.
  if (resolved.some(({ address }) => isBlockedAddress(address))) {
    return { valid: false, error: PRIVATE_DENIED };
  }

  return { valid: true, addresses: resolved.map((r) => r.address) };
}
