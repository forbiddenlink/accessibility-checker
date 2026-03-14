// Server Component - no "use client" directive
// This component contains only static content that can be server-rendered

export default function HeroSection() {
  return (
    <section className="relative py-16 text-center space-y-6">
      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-caption text-muted-foreground backdrop-blur-xl">
        <span className="flex h-2 w-2 rounded-full bg-success mr-2"></span>
        WCAG 2.1 &amp; APCA Compliant
      </div>
      <h1 className="text-display md:text-[4.5rem] tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-[1.1]">
        Precision Contrast<br />Control.
      </h1>
      <p className="text-h3 text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
        Advanced color accessibility tools for designers and developers.
        Check contrast ratios, analyze websites, and build inclusive experiences.
      </p>
    </section>
  );
}
