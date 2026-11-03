import { describe, expect, it } from "vitest";
import { cascadeCount, tickerFrames } from "./settle-ceremony";

describe("cascadeCount", () => {
  it("is one coin per press settled, capped at 40: 0 -> 0, 12 -> 12, 100 -> 40", () => {
    expect([0, 12, 100].map(cascadeCount)).toEqual([0, 12, 40]);
  });
});

describe("tickerFrames", () => {
  it("ticks £24.00 up to £36.50 in 5 steps of £2.50", () => {
    expect(tickerFrames(2400, 3650, 5)).toEqual([2400, 2650, 2900, 3150, 3400, 3650]);
  });
});
