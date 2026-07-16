// Server Component - no "use client" directive
// Composes Server and Client components for optimal performance

import HeroSection from "@/components/HeroSection";
import ColorContrastChecker from "@/components/ColorContrastChecker";
import WcagInformation from "@/components/WcagInformation";
import FontSizeAccessibility from "@/components/FontSizeAccessibility";
import AccessibilityLearningHub from "@/components/AccessibilityLearningHub";

export default function Home() {
  return (
    <div className="space-y-12 pb-24">
      {/* Server-rendered static content */}
      <HeroSection />

      {/* Client-rendered interactive content */}
      <ColorContrastChecker />

      {/* Reference material. WcagInformation and FontSizeAccessibility hold no
          state, so they stay server-rendered and cost no client JS. */}
      <section aria-labelledby="learn-heading" className="space-y-8">
        <h2 id="learn-heading" className="sr-only">
          Learn about accessibility
        </h2>
        <WcagInformation />
        <FontSizeAccessibility />
        <AccessibilityLearningHub />
      </section>
    </div>
  );
}
