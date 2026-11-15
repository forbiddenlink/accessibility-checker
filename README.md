# Precision Contrast

Precision Contrast is a web app for checking accessibility. Beyond contrast checking, it
analyzes semantic structure, keyboard navigation, forms, images, dynamic content and
color perception.

Live site: <https://precision-contrast.vercel.app>

## Features

### Color tools

- **Contrast analysis**: WCAG 2.1 (AA/AAA) ratios, plus APCA lightness contrast.
- **Suggestions**: accessible color and palette recommendations derived from your
  current colors that keep the ratio above your target.
- **Color blindness simulation**: preview your pair under protanopia, deuteranopia,
  tritanopia, and achromatopsia.

### Page analyzers

Each of these fetches a URL you supply and inspects the rendered page in a headless
browser:

- **Website analyzer**: crawls the site and reports axe-core violations per page.
- **Semantic structure analyzer**: visualizes HTML hierarchy and document flow.
- **Keyboard navigation checker**: verifies tab order and focus states.
- **Form accessibility analyzer**: checks labels, error states, and ARIA attributes.
- **Image accessibility analyzer**: audits alt text and decorative image usage.
- **Dynamic content analyzer**: inspects live regions and modal dialog semantics.

### Output and interface

- **Themes**: light and dark, defined in `src/app/globals.css`.
- **Export**: download results as a PDF report.

## Privacy

Contrast checking, suggestions, and color blindness simulation run entirely in your
browser, and saved palettes stay in `localStorage`.

The URL analyzers are the exception: a URL you submit is sent to this app's server and
fetched there, because inspecting a page needs a real browser engine. Requests to
private, loopback, and link-local addresses are rejected. See the
[privacy policy](src/app/privacy/page.tsx) for details.

## Tech stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + custom design tokens
- **Analysis**: axe-core, apca-w3, Playwright (`playwright-core` + `@sparticuz/chromium`
  on serverless)
- **Testing**: Vitest + React Testing Library + Playwright

## Getting started

Requires Node.js 24 (`engines` in `package.json`) and [pnpm](https://pnpm.io/).

1. **Clone the repository**

   ```bash
   git clone https://github.com/forbiddenlink/accessibility-checker.git
   cd accessibility-checker
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run the development server**

   ```bash
   pnpm dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**.

Copy `.env.example` to `.env.local` if you want rate limiting and bot protection
locally; both are optional in development.

### Useful scripts

| Script           | Purpose                       |
| ---------------- | ----------------------------- |
| `pnpm test`      | Unit tests (Vitest)           |
| `pnpm test:e2e`  | End-to-end tests (Playwright) |
| `pnpm lint`      | ESLint, including jsx-a11y    |
| `pnpm typecheck` | TypeScript                    |
| `pnpm build`     | Production build              |
| `pnpm check`     | Lint, typecheck and unit tests |

## Contributing

Read the [Contributing guide](CONTRIBUTING.md) before you open a pull request.

## License

MIT. See [LICENSE](LICENSE).
