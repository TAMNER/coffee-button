import { describe, expect, it } from "vitest";
import { ceremonyTimeline } from "./ceremony-timeline";
import { pressVibration } from "./vibration";

/** When each buzz starts, in ms from the press: the pattern alternates on, off, on... */
function buzzStarts(pattern: number[]): number[] {
  const starts: number[] = [];
  let t = 0;
  pattern.forEach((ms, i) => {
    if (i % 2 === 0) starts.push(t);
    t += ms;
  });
  return starts;
}

describe("pressVibration", () => {
  it("ticks at the press, buzzes as the coin lands, then flutters in the cheer", () => {
    const steps = ceremonyTimeline();
    const pattern = pressVibration(steps);
    // pour 800 + coin 500: the coin lands at 1300 ms, and the cheer runs 1300 to 2000 ms.
    const starts = buzzStarts(pattern);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBe(1300);
    const flutter = starts.slice(2);
    expect(flutter.length).toBeGreaterThanOrEqual(3);
    for (const start of flutter) {
      expect(start).toBeGreaterThan(1300);
      expect(start).toBeLessThan(2000);
    }
    // The landing buzz is firmer (longer) than the press tick and each flutter pulse.
    expect(pattern[2]).toBeGreaterThan(pattern[0]);
    for (let i = 4; i < pattern.length; i += 2) expect(pattern[2]).toBeGreaterThan(pattern[i]);
    // The whole pattern ends inside the ceremony.
    expect(pattern.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(2000);
  });
});
