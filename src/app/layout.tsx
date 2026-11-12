import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import CookieConsent from "@/components/CookieConsent";
import ThemeToggle from "@/components/ThemeToggle";
import CookiePreferencesButton from "@/components/CookiePreferencesButton";
import "./globals.css";

// Display: Archivo at condensed widths for calibration-card lettering.
// Body: IBM Plex Sans. Labels and measured figures: IBM Plex Mono.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// Runs before paint so a saved theme choice never flashes the other theme.
const themeInit = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://precision-contrast.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Precision Contrast: Accessibility Color Checker",
    template: "%s | Precision Contrast",
  },
  description:
    "Check color combinations for WCAG 2.1 and APCA accessibility compliance. Analyze websites, images, and forms for accessibility issues.",
  keywords: [
    "accessibility",
    "WCAG",
    "APCA",
    "color contrast",
    "a11y",
    "web accessibility",
  ],
  authors: [{ name: "Precision Contrast" }],
  creator: "Precision Contrast",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Precision Contrast",
    title: "Precision Contrast: Accessibility Color Checker",
    description:
      "Check color combinations for WCAG 2.1 and APCA accessibility compliance.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Precision Contrast: Accessibility Color Checker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precision Contrast: Accessibility Color Checker",
    description:
      "Check color combinations for WCAG 2.1 and APCA accessibility compliance.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Precision Contrast",
    description:
      "Check color combinations for WCAG 2.1 and APCA accessibility compliance",
    url: siteUrl,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts load through next/font/google, which self-hosts them at
            build time: no runtime request reaches Google. */}
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${plexSans.variable} ${archivo.variable} ${plexMono.variable} min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-foreground focus:text-background focus:outline-none"
        >
          Skip to main content
        </a>

        <header className="masthead">
          <nav
            aria-label="Main navigation"
            className="mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
          >
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Precision Contrast home"
            >
              <svg
                aria-hidden="true"
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="14" cy="14" r="8" />
                <path d="M14 1v26M1 14h26" />
                <circle cx="14" cy="14" r="2.5" fill="currentColor" />
              </svg>
              <span className="font-display text-lg leading-none sm:text-2xl">
                Precision Contrast
              </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="hidden items-center gap-6 text-sm md:flex">
                <Link href="/#checker">Checker</Link>
                <Link href="/#analyze">Analyze</Link>
                <Link href="/#learn">Learn</Link>
                <Link href="/api/docs">API docs</Link>
              </div>
              <ThemeToggle />
              <Link href="/#checker" className="btn-accent !px-3 !py-2 text-sm sm:!px-4">
                Check a pair
              </Link>
            </div>
          </nav>
        </header>

        <main
          id="main-content"
          className="mx-auto max-w-[88rem] px-4 pt-10 pb-24 sm:px-6 lg:px-8 lg:pt-16"
        >
          {children}
        </main>

        <footer className="footer-inverse">
          <div className="mx-auto max-w-[88rem] px-4 pt-14 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-[1fr_auto]">
              <p className="font-display max-w-3xl text-3xl leading-tight sm:text-5xl">
                Contrast is a measurement, not a mood.
              </p>
              <nav
                aria-label="Footer navigation"
                className="flex flex-col gap-2 text-sm md:items-end"
              >
                <Link href="/api/docs">API docs</Link>
                <Link href="/privacy">Privacy policy</Link>
                <Link href="/terms">Terms of service</Link>
                <a
                  href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WCAG 2.1
                </a>
                <a
                  href="https://www.myndex.com/APCA/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  APCA
                </a>
                <CookiePreferencesButton />
              </nav>
            </div>
            <p className="eyebrow mt-10 mb-6">
              &copy; {new Date().getFullYear()} Precision Contrast
            </p>
            <div className="footer-wordmark select-none" aria-hidden="true">
              Precision Contrast
            </div>
          </div>
        </footer>

        <CookieConsent />
      </body>
    </html>
  );
}
