// Server Component - no "use client" directive
// Composes Server and Client components for optimal performance

import HeroSection from "@/components/HeroSection";
import ColorContrastChecker from "@/components/ColorContrastChecker";
import WcagInformation from "@/components/WcagInformation";
import FontSizeAccessibility from "@/components/FontSizeAccessibility";
import AccessibilityLearningHub from "@/components/AccessibilityLearningHub";

export default function Home() {
  return (
    <div className="space-y-24 lg:space-y-32">
      <HeroSection />

      {/* Client-rendered interactive content: the checker and the analyzers */}
      <ColorContrastChecker />

      {/* Reference material. WcagInformation and FontSizeAccessibility hold no
          state, so they stay server-rendered and cost no client JS. */}
      <section aria-labelledby="learn-heading" id="learn" className="scroll-mt-20">
        <div className="sec-head">
          <span className="eyebrow">03</span>
          <h2 id="learn-heading">Thresholds and reading list</h2>
        </div>
        <div className="space-y-8">
          <WcagInformation />
          <FontSizeAccessibility />
          <AccessibilityLearningHub />
        </div>
      </section>
    </div>
  );
}
