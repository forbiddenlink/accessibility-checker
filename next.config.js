import withBundleAnalyzerInit from "@next/bundle-analyzer";
const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  poweredByHeader: false,
  // @sparticuz/chromium resolves its binary via paths relative to its own
  // package, so it must not be bundled. playwright-core rides along with it.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  // Externalised packages are traced from node_modules rather than bundled,
  // and Next's tracer only follows static requires. playwright-core reads
  // browsers.json (and other data files) by runtime path, and @sparticuz ships
  // its chromium as .br blobs, so neither is picked up automatically and the
  // analyzer functions crash with "Cannot find module browsers.json". Force
  // both package trees into the analyzer route bundles.
  outputFileTracingIncludes: {
    "/api/analyze-**": [
      "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/**",
      "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/**",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
