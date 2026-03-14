// Server Component - no "use client" directive
// Composes Server and Client components for optimal performance

import HeroSection from "@/components/HeroSection";
import ColorContrastChecker from "@/components/ColorContrastChecker";

export default function Home() {
  return (
    <div className="space-y-12 pb-24">
      {/* Server-rendered static content */}
      <HeroSection />

      {/* Client-rendered interactive content */}
      <ColorContrastChecker />
    </div>
  );
}
