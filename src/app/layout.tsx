import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono"
});

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
    <html lang="en" className="dark">
      <body className={`${inter.className} ${jetbrainsMono.variable} min-h-screen bg-background text-foreground antialiased selection:bg-white/20`}>
        {/* Background Effects */}
        <div className="bg-noise" />
        <div className="mesh-gradient" />
        
        {/* Floating Navigation */}
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <nav className="glass-panel rounded-full px-6 py-3 flex items-center gap-8 pointer-events-auto shadow-2xl shadow-black/30">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <div className="h-2 w-2 bg-black rounded-full" />
              </div>
              <span className="font-semibold tracking-tight text-body-sm">AccessCheck</span>
            </Link>
            
            <div className="h-4 w-px bg-white/10" />
            
            <div className="flex items-center gap-6 text-body-sm">
              <Link href="/api/docs" className="text-muted-foreground hover:text-white transition-colors duration-200">API Docs</Link>
            </div>
            
            <div className="pl-4 border-l border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
            </div>
          </nav>
        </div>

        <main className="max-w-7xl mx-auto px-4 pt-32 pb-20 sm:px-6 lg:px-8">
          {children}
        </main>
        
        <footer className="border-t border-white/5 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-caption text-muted-foreground">
              <p>AccessCheck © 2026</p>
              <div className="flex gap-6">
                <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" className="hover:text-white transition-colors duration-200" target="_blank" rel="noopener noreferrer">WCAG 2.1</a>
                <a href="https://www.myndex.com/APCA/" className="hover:text-white transition-colors duration-200" target="_blank" rel="noopener noreferrer">APCA</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
