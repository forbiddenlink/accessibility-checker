import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Accessibility Color Checker",
  description: "Check color combinations for WCAG accessibility compliance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 to-slate-100`}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),transparent)]" />
        <header className="glass-morphism sticky top-0 z-10 mb-8">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
                Accessibility Color Checker
              </Link>
              <nav>
                <Link 
                  href="/api/docs" 
                  className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  API Docs
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="glass-morphism mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-slate-600">
              Built with accessibility in mind • 
              <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="ml-1 text-blue-600 hover:text-blue-700 transition-colors">
                WCAG Guidelines
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
