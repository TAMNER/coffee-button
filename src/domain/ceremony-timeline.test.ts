import { describe, expect, it } from "vitest";
import { ceremonyTimeline } from "./ceremony-timeline";

describe("ceremonyTimeline", () => {
  it("is pour, then coin, then cheer, lasting about two seconds in total", () => {
    const steps = ceremonyTimeline();
    expect(steps.map((s) => s.name)).toEqual(["pour", "coin", "cheer"]);
    for (const step of steps) expect(step.durationMs).toBeGreaterThan(0);
    const total = steps.reduce((sum, s) => sum + s.durationMs, 0);
    // DESIGN.md: "~2 s"; ticket 04: "about two seconds".
    expect(total).toBeGreaterThanOrEqual(1800);
    expect(total).toBeLessThanOrEqual(2200);
  });
});

describe("ceremonyTimeline for a vessel with no pour (Lunch)", () => {
  it("skips the pour and goes coin then cheer, with the same coin and cheer as the pouring timeline", () => {
    const steps = ceremonyTimeline({ pour: false });
    expect(steps.map((s) => s.name)).toEqual(["coin", "cheer"]);
    expect(steps).toEqual(ceremonyTimeline().filter((s) => s.name !== "pour"));
  });
});
