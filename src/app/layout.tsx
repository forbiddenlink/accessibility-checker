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
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased selection:bg-white/20`}>
        {/* Background Effects */}
        <div className="bg-noise" />
        <div className="mesh-gradient" />
        
        {/* Floating Navigation */}
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <nav className="glass-panel rounded-full px-6 py-3 flex items-center space-x-8 pointer-events-auto shadow-2xl shadow-black/20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="h-2 w-2 bg-black rounded-full" />
              </div>
              <span className="font-medium tracking-tight text-sm">AccessCheck</span>
            </Link>
            
            <div className="h-4 w-[1px] bg-white/10" />
            
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/manual" className="text-muted-foreground hover:text-white transition-colors">Manual</Link>
              <Link href="/api/docs" className="text-muted-foreground hover:text-white transition-colors">API</Link>
            </div>
            
            <div className="pl-4 border-l border-white/10">
               <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
          </nav>
        </div>

        <main className="max-w-7xl mx-auto px-4 pt-32 pb-20 sm:px-6 lg:px-8">
          {children}
        </main>
        
        <footer className="border-t border-white/5 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <p>Cinematic Accessibility Tools © 2026</p>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" className="hover:text-white transition-colors">WCAG 2.1</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
