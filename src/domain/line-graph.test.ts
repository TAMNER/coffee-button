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

  it("starts on the first press day and spans a full week until there is one: three days in, the line stops partway", () => {
    // savingsSeries reaches back seven days; the days before the first press are not drawn.
    const g = lineGraph(series("2026-11-11", [0, 0, 0, 0, 350, 350, 1150]))!;
    expect(g.points.map((p) => p.x)).toEqual([0, 1 / 6, 2 / 6]);
    expect(g.points.map((p) => p.saved)).toEqual([350 / 1500, 350 / 1500, 1150 / 1500]);
  });

  it("from a week on, the first press is the left edge and today the right; invested is on the same scale", () => {
    const g = lineGraph(series("2026-10-18", Array.from({ length: 31 }, (_, i) => 100 * (i + 1)), Array.from({ length: 31 }, (_, i) => (i >= 8 ? 800 : 0))))!;
    expect(g.points).toHaveLength(31);
    expect(g.points[0].x).toBe(0);
    expect(g.points[30].x).toBe(1);
    expect(g.points[15].x).toBe(0.5);
    expect(g.points[30].saved).toBe(3100 / 4000);
    expect(g.points[7].invested).toBe(0);
    expect(g.points[8].invested).toBe(800 / 4000);
  });

  it("every point says its day and both figures; the last one says Today", () => {
    const g = lineGraph(series("2026-11-11", [350, 350, 1150], [0, 0, 350]))!;
    expect(g.points.map((p) => p.readout)).toEqual([
      "11 Nov: £3.50 saved, £0 invested",
      "12 Nov: £3.50 saved, £0 invested",
      "Today: £11.50 saved, £3.50 invested",
    ]);
  });

  describe("the dates along the bottom", () => {
    it("in the first week: a tick and a date for each of the seven days, today named, the days to come dated", () => {
      const g = lineGraph(climbing("2026-11-15", 3))!;
      expect(g.xTicks).toEqual([0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1]);
      expect(g.xLabels.map((l) => l.label)).toEqual(["15 Nov", "16 Nov", "today", "18 Nov", "19 Nov", "20 Nov", "21 Nov"]);
      expect(g.xLabels.map((l) => l.x)).toEqual(g.xTicks);
    });

    it("from eight days to two months: at most six dated ticks, evenly spaced back from today", () => {
      const eight = lineGraph(climbing("2026-11-10", 8))!;
      expect(eight.xLabels).toEqual([
        { label: "11 Nov", x: 1 / 7 },
        { label: "13 Nov", x: 3 / 7 },
        { label: "15 Nov", x: 5 / 7 },
        { label: "today", x: 1 },
      ]);
      expect(eight.xTicks).toEqual([1 / 7, 3 / 7, 5 / 7, 1]);
      const month = lineGraph(climbing("2026-10-18", 31))!;
      expect(month.xLabels.map((l) => l.label)).toEqual(["18 Oct", "24 Oct", "30 Oct", "5 Nov", "11 Nov", "today"]);
    });

    it("beyond two months: a tick where each month starts and the month's name in the middle of its stretch", () => {
      // 15 Jun to 17 Nov 2026: 156 days.
      const g = lineGraph(climbing("2026-06-15", 156))!;
      expect(g.xTicks).toEqual([16, 47, 78, 108, 139].map((d) => d / 155));
      expect(g.xLabels.map((l) => l.label)).toEqual(["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]);
      expect(g.xLabels[0].x).toBe(8 / 155);
      expect(g.xLabels[5].x).toBe((139 + 155) / 2 / 155);
    });

    it("a sliver of a first month is too narrow for its name", () => {
      // 29 Jun to 17 Nov 2026.
      const g = lineGraph(climbing("2026-06-29", 142))!;
      expect(g.xLabels.map((l) => l.label)).toEqual(["Jul", "Aug", "Sep", "Oct", "Nov"]);
    });

    it("over years, month names thin out so they never crowd; the newest month keeps its name", () => {
      const g = lineGraph(climbing("2024-11-01", 747))!; // to 17 Nov 2026
      expect(g.xLabels.length).toBeLessThanOrEqual(8);
      expect(g.xLabels[g.xLabels.length - 1].label).toBe("Nov");
    });
  });
});
