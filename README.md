# Precision Contrast

A professional accessibility suite for interface designers and developers. Beyond
contrast checking, it analyses semantic structure, keyboard navigation, forms, images,
and colour perception, wrapped in a dark "Cinematic Archive" aesthetic.

## ✨ Features

### 🎨 Colour intelligence

- **Contrast analysis**: WCAG 2.1 (AA/AAA) ratios, plus APCA lightness contrast.
- **Suggestions**: accessible colour and palette recommendations derived from your
  current colours that keep the ratio above your target.
- **Colour blindness simulation**: preview your pair under protanopia, deuteranopia,
  tritanopia, and achromatopsia.

### 🛠 Accessibility analysers

Each of these fetches a URL you supply and inspects the rendered page in a headless
browser:

- **Website analyser**: crawls the site and reports axe-core violations per page.
- **Semantic structure analyser**: visualises HTML hierarchy and document flow.
- **Keyboard navigation checker**: verifies tab order and focus states.
- **Form accessibility analyser**: checks labels, error states, and ARIA attributes.
- **Image accessibility analyser**: audits alt text and decorative image usage.
- **Dynamic content analyser**: inspects live regions and modal dialog semantics.

### 💎 Experience

- **Cinematic interface**: deep dark mode (`#0a0a0a`) with glassmorphism and noise.
- **Export**: download results as a PDF report.

## 🔒 Privacy

Contrast checking, suggestions, and colour blindness simulation run entirely in your
browser, and saved palettes stay in `localStorage`.

The URL analysers are the exception: a URL you submit is sent to this app's server and
fetched there, because inspecting a page needs a real browser engine. Requests to
private, loopback, and link-local addresses are rejected. See the
[privacy policy](src/app/privacy/page.tsx) for details.

## 🚀 Tech stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + custom design tokens
- **Analysis**: axe-core, apca-w3, Playwright (`playwright-core` + `@sparticuz/chromium`
  on serverless)
- **Testing**: Vitest + React Testing Library + Playwright

## 📦 Getting started

Requires Node.js >= 20 and [pnpm](https://pnpm.io/).

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

## 🤝 Contributing

We welcome contributions to make the web more accessible for everyone. Please read our
[Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process
for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for
details.

---

<p align="center">
  Built with ❤️ for the accessible web.
</p>
