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

/**
 * Expand an IPv6 literal into its eight 16-bit groups. Handles `::`
 * compression and a dotted-quad tail (`::ffff:1.2.3.4`). Returns null for
 * anything that is not a well-formed address, so callers fail closed.
 */
function parseV6(address: string): number[] | null {
  let addr = address;

  const tail = addr.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (tail?.[1] && tail[2]) {
    if (net.isIP(tail[2]) !== 4) return null;
    const v4 = v4ToInt(tail[2]);
    addr = `${tail[1]}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }

  const halves = addr.split("::");
  if (halves.length > 2) return null;

  const toGroups = (part: string): number[] | null => {
    if (part === "") return [];
    const groups = part.split(":").map((g) => parseInt(g, 16));
    return groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff)
      ? groups
      : null;
  };

  const head = toGroups(halves[0] ?? "");
  const rest = halves.length === 2 ? toGroups(halves[1] ?? "") : [];
  if (!head || !rest) return null;

  if (halves.length === 1) return head.length === 8 ? head : null;
  const fill = 8 - head.length - rest.length;
  if (fill < 1) return null;
  return [...head, ...new Array<number>(fill).fill(0), ...rest];
}

const groupsToV4 = (high: number, low: number): string =>
  [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");

/**
 * The IPv4 address an IPv6 address tunnels to, or null when it is not one of
 * the embedding forms. Each of these reaches the embedded v4 host, so the v4
 * blocklist has to be applied to it:
 *   ::a.b.c.d          IPv4-compatible (deprecated, still routable by some stacks)
 *   ::ffff:a.b.c.d     IPv4-mapped
 *   ::ffff:0:a.b.c.d   IPv4-translated (SIIT)
 *   64:ff9b::a.b.c.d   NAT64 well-known prefix
 *   2002:AABB:CCDD::   6to4, v4 sits in bits 16-47
 * `new URL()` rewrites dotted tails into hex groups, so this works on groups,
 * never on the dotted spelling.
 */
function embeddedV4(groups: number[]): string | null {
  const [g0, g1, g2, g3, g4, g5, g6, g7] = groups as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const zeros = (n: number) => groups.slice(0, n).every((g) => g === 0);

  if (zeros(5) && g5 === 0xffff) return groupsToV4(g6, g7); // mapped
  if (zeros(6)) return groupsToV4(g6, g7); // compatible
  if (zeros(4) && g4 === 0xffff && g5 === 0) return groupsToV4(g6, g7); // SIIT
  if (
    g0 === 0x64 &&
    g1 === 0xff9b &&
    g2 === 0 &&
    g3 === 0 &&
    g4 === 0 &&
    g5 === 0
  ) {
    return groupsToV4(g6, g7); // NAT64
  }
  if (g0 === 0x2002) return groupsToV4(g1, g2); // 6to4
  return null;
}

function isBlockedV6(address: string): boolean {
  const addr = address.toLowerCase().split("%")[0] ?? ""; // strip zone index
  const groups = parseV6(addr);
  if (!groups) return true; // malformed — fail closed

  const v4 = embeddedV4(groups);
  if (v4) return isBlockedV4(v4);

  // 64:ff9b:1::/48 is the local-use NAT64 prefix (RFC 8215): the embedded v4
  // sits at an operator-chosen offset, so deny the whole range.
  if (groups[0] === 0x64 && groups[1] === 0xff9b && groups[2] === 1)
    return true;

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
  const groups = parseV6(addr.split("%")[0] ?? "");
  const embedded = groups ? embeddedV4(groups) : null;
  return embedded ? isLoopbackLiteral(embedded) : false;
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
