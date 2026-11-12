// Server Component: static content, no client JS.
// The object is a printed calibration card. The signature move is the step
// wedge: twelve grey steps, each printed with its measured contrast against
// the page ground, with a pointer that lands on the 4.5:1 step.

import { buildWedge } from "@/utils/stepWedge";

const MARKS: Record<number, string> = {
  3: "AA large text, UI",
  4.5: "AA body text",
  7: "AAA body text",
};

export default function HeroSection() {
  const steps = buildWedge();

  return (
    <section aria-labelledby="hero-heading">
      <p className="eyebrow mb-6">WCAG 2.1 contrast, APCA lightness contrast</p>
      <h1
        id="hero-heading"
        className="font-display text-[clamp(3.5rem,11vw,8.5rem)] leading-[0.94]"
      >
        Measure the gap between text and ground.
      </h1>

      <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,34rem)_auto] md:items-end md:justify-between">
        <p className="text-lg leading-relaxed">
          Precision Contrast checks any foreground and background pair against
          WCAG 2.1 and APCA, then audits a live page, an image or a form. Color
          checks run in your browser.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#checker" className="btn-accent">
            Check a pair
          </a>
          <a href="#analyze" className="btn-line">
            Analyze a website
          </a>
        </div>
      </div>

      <figure className="wedge" aria-labelledby="wedge-caption">
        <ol
          className="wedge-steps"
          aria-label="Step wedge: twelve grey steps and their contrast ratio against the page background"
        >
          {steps.map((step, i) => (
            <li
              key={step.ratio}
              className="wedge-step"
              style={
                {
                  "--l": step.light,
                  "--d": step.dark,
                  "--i": i,
                } as React.CSSProperties
              }
            >
              <span className="wedge-chip" aria-hidden="true" />
              <span className="wedge-val">
                {step.ratio}
                <span className="text-[rgb(var(--muted-foreground))]">:1</span>
              </span>
              <span
                className="wedge-mark"
                data-pass={step.ratio >= 4.5 ? "" : undefined}
              >
                {MARKS[step.ratio] ?? ""}
              </span>
              {step.ratio === 4.5 && (
                <span className="wedge-pointer" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
        <figcaption id="wedge-caption" className="wedge-caption">
          Body text passes from here.
        </figcaption>
      </figure>
    </section>
  );
}
