import { describe, expect, it } from "vitest";
import { lineGraph } from "./line-graph";
import type { SavingsDay, SavingsSeries } from "./savings-series";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A series from `first` ("YYYY-MM-DD") with the given running saved totals, one per day; invested per day optional (else nothing). */
function series(first: string, saved: number[], invested: number[] = []): SavingsSeries {
  const start = Date.parse(`${first}T00:00:00Z`);
  const days: SavingsDay[] = saved.map((savedPence, i) => ({
    day: new Date(start + i * DAY_MS).toISOString().slice(0, 10),
    savedPence,
    investedPence: invested[i] ?? 0,
  }));
  const last = days[days.length - 1];
  return { days, savedPence: last?.savedPence ?? 0, investedPence: last?.investedPence ?? 0 };
}
/** n days climbing by `step` pence a day. */
const climbing = (first: string, n: number, step = 100) => series(first, Array.from({ length: n }, (_, i) => step * (i + 1)));

describe("lineGraph (ticket 39)", () => {
  it("is absent before the first press", () => {
    expect(lineGraph({ days: [], savedPence: 0, investedPence: 0 })).toBeNull();
  });

  it("labels the two figures, pence kept when there are any, and says them in the text alternative", () => {
    const g = lineGraph(series("2026-11-11", [350, 38130], [0, 33720]))!;
    expect(g.savedLabel).toBe("£381.30 saved");
    expect(g.investedLabel).toBe("£337.20 invested");
    expect(g.alt).toBe("Savings over time: £381.30 saved, £337.20 invested.");
    expect(g.hasInvested).toBe(true);
    const none = lineGraph(series("2026-11-11", [2800]))!;
    expect(none.investedLabel).toBe("£0 invested");
    expect(none.hasInvested).toBe(false);
  });

  it("the money scale climbs in round steps, at most five lines, to at or above today's total", () => {
    const labels = (pence: number) => lineGraph(series("2026-11-11", [pence]))!.yTicks.map((t) => t.label);
    expect(labels(2800)).toEqual(["£0", "£10", "£20", "£30"]);
    expect(labels(38130)).toEqual(["£0", "£100", "£200", "£300", "£400"]);
    expect(labels(350)).toEqual(["£0", "£1", "£2", "£3", "£4"]);
    expect(labels(90000)).toEqual(["£0", "£250", "£500", "£750", "£1000"]);
    expect(lineGraph(series("2026-11-11", [2800]))!.yTicks.map((t) => t.fraction)).toEqual([0, 1 / 3, 2 / 3, 1]);
  });
});
