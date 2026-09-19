# accessibility-checker (Precision Contrast)

Accessibility suite for interface designers and developers: WCAG 2.1 (AA/AAA) + APCA
contrast checking, colour blindness simulation, and axe-core based analysers
(semantic structure, keyboard navigation, forms, images, dynamic content/ARIA) that
crawl a URL you supply in a headless browser. No live URL on file; GitHub repo is
forbiddenlink/accessibility-checker.

## Privacy model

Contrast checking, colour suggestions, and colour blindness simulation run entirely
client-side; saved palettes live in `localStorage`. The URL analysers are the
exception: a submitted URL is fetched server-side (needs a real browser engine).
Requests to private/loopback/link-local addresses are rejected. See
`src/app/privacy/page.tsx`.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript
- Tailwind CSS v4 + custom design tokens
- Analysis: axe-core, apca-w3, `playwright-core` + `@sparticuz/chromium` (serverless
  headless browser)
- Testing: Vitest + React Testing Library (unit), Playwright (e2e)
- Rate limiting/bot protection: `@arcjet/next` + Upstash Redis (`@upstash/ratelimit`)
- pnpm (`pnpm@10.18.0` pinned), Node >= 20

## Commands

```bash
pnpm install
pnpm dev             # next dev
pnpm build
pnpm start
pnpm check           # lint + typecheck + test
pnpm lint            # eslint .
pnpm lint:fix
pnpm typecheck       # tsc --noEmit
pnpm test            # vitest run
pnpm test:watch
pnpm test:coverage
pnpm test:e2e        # playwright test
pnpm biome:check     # biome check . (secondary linter, not the primary lint script)
pnpm biome:fix
pnpm analyze         # ANALYZE=true next build (bundle analyzer)
```

Formatting on commit runs through `lint-staged` + `prettier` (husky pre-commit), not
biome. `pnpm lint` uses ESLint (`eslint-plugin-jsx-a11y` included); biome scripts exist
but are not the enforced linter.

## Layout

- `src/app` - App Router pages + `src/app/api/*` route handlers (one per analyser:
  `analyze-website`, `analyze-forms`, `analyze-images`, `analyze-keyboard`,
  `analyze-dynamic-content`; also `api/v1/contrast`, `api/v1/palettes`, `api/docs`)
- `src/components` - one component per analyser/feature (e.g. `WebsiteAnalyzer.tsx`,
  `ColorContrastChecker.tsx`, `KeyboardNavigationChecker.tsx`)
- `src/hooks`, `src/utils`, `src/types`, `src/mocks` (MSW mocks for tests)
- `src/middleware.ts` - Arcjet shield + bot detection on `/api/*`, deliberately skips
  bot detection for the documented public API routes (every non-browser client looks
  like a bot to Arcjet)
- `e2e/` - Playwright specs (`analyzers.spec.ts`, `core-journey.spec.ts`)

## Env vars

`ARCJET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
`NEXT_PUBLIC_SITE_URL`. Copy `.env.example` to `.env.local`; Arcjet + rate limiting are
optional in development. `VERCEL` / `AWS_LAMBDA_FUNCTION_VERSION` are read to detect
the serverless runtime (for the `@sparticuz/chromium` Playwright launch path).

## Gotchas

- If `ARCJET_KEY` is unset in production, the middleware logs an error but Arcjet
  fails open: requests are served with no shield/bot protection and no visible
  failure. Confirm the key is set before trusting production traffic is protected.
- The URL analysers spin up a real headless browser server-side; only http(s) targets
  outside private/loopback/link-local ranges are accepted (SSRF guard).
- `pnpm test` and `pnpm test:unit` are the same command (`vitest run`) - `test:unit`
  is not a separate suite.
