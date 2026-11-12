import { describe, expect, it } from "vitest";
import { buildWedge, contrast, DARKROOM, PAPER } from "./stepWedge";

describe("step wedge", () => {
  it("prints ratios that match measured contrast against the ground", () => {
    for (const step of buildWedge()) {
      // 8-bit rounding of a grey moves the ratio slightly; 4% is well inside
      // the distance between neighbouring steps.
      expect(contrast(step.light, PAPER) / step.ratio).toBeGreaterThan(0.96);
      expect(contrast(step.light, PAPER) / step.ratio).toBeLessThan(1.04);
      expect(contrast(step.dark, DARKROOM) / step.ratio).toBeGreaterThan(0.96);
      expect(contrast(step.dark, DARKROOM) / step.ratio).toBeLessThan(1.04);
    }
  });

  it("places steps exactly on the WCAG thresholds", () => {
    const ratios = buildWedge().map((s) => s.ratio);
    expect(ratios).toContain(3);
    expect(ratios).toContain(4.5);
    expect(ratios).toContain(7);
  });
});
