import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://accesscheck.app";

export const metadata: Metadata = {
  title: {
    default: "AccessCheck - Accessibility Color Checker",
    template: "%s | AccessCheck",
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
  authors: [{ name: "AccessCheck" }],
  creator: "AccessCheck",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AccessCheck",
    title: "AccessCheck - Accessibility Color Checker",
    description:
      "Check color combinations for WCAG 2.1 and APCA accessibility compliance.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "AccessCheck - Accessibility Color Checker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AccessCheck - Accessibility Color Checker",
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
    name: "AccessCheck",
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} ${jetbrainsMono.variable} min-h-screen bg-background text-foreground antialiased selection:bg-white/20`}
      >
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Background Effects */}
        <div className="bg-noise" aria-hidden="true" />
        <div className="mesh-gradient" aria-hidden="true" />

        {/* Floating Navigation */}
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <nav
            aria-label="Main navigation"
            className="glass-panel rounded-full px-6 py-3 flex items-center gap-8 pointer-events-auto shadow-2xl shadow-black/30"
          >
            <Link
              href="/"
              className="flex items-center gap-3 group"
              aria-label="AccessCheck Home"
            >
              <div
                className="h-7 w-7 rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
                aria-hidden="true"
              >
                <div className="h-2 w-2 bg-black rounded-full" />
              </div>
              <span className="font-semibold tracking-tight text-body-sm">
                AccessCheck
              </span>
            </Link>

            <div className="h-4 w-px bg-white/10" aria-hidden="true" />

            <div className="flex items-center gap-6 text-body-sm">
              <Link
                href="/api/docs"
                className="text-muted-foreground hover:text-white transition-colors duration-200"
              >
                API Docs
              </Link>
            </div>

            {/* aria-label is ignored on a bare div, and a green dot alone
                conveys status by colour only (WCAG 1.4.1). */}
            <div role="status" className="pl-4 border-l border-white/10">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="sr-only">Service status: Online</span>
            </div>
          </nav>
        </div>

        <main
          id="main-content"
          className="max-w-7xl mx-auto px-4 pt-32 pb-20 sm:px-6 lg:px-8"
        >
          {children}
        </main>

        <footer className="border-t border-white/5 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-caption text-muted-foreground">
              <p>AccessCheck &copy; {new Date().getFullYear()}</p>
              <nav aria-label="Footer navigation" className="flex gap-6">
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors duration-200"
                >
                  Terms of Service
                </Link>
                <a
                  href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                  className="hover:text-white transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WCAG 2.1
                </a>
                <a
                  href="https://www.myndex.com/APCA/"
                  className="hover:text-white transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  APCA
                </a>
              </nav>
            </div>
          </div>
        </footer>

        <CookieConsent />
      </body>
    </html>
  );
}
