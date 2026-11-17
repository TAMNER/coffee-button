import { describe, expect, it } from "vitest";
import { glassFill, glassPeriods, latteGraph } from "./latte-graph";
import { savingsSeries, type SavingsDay, type SavingsSeries } from "./savings-series";

const DAY_MS = 24 * 60 * 60 * 1000;

/** n days from `first` ("YYYY-MM-DD"); day i has saved 100*(i+1) and invested 10*(i+1), so every day is recognisable. */
function series(first: string, n: number): SavingsSeries {
  const start = Date.parse(`${first}T00:00:00Z`);
  const days: SavingsDay[] = Array.from({ length: n }, (_, i) => ({
    day: new Date(start + i * DAY_MS).toISOString().slice(0, 10),
    savedPence: 100 * (i + 1),
    investedPence: 10 * (i + 1),
  }));
  const last = days[days.length - 1];
  return { days, savedPence: last.savedPence, investedPence: last.investedPence };
}

describe("glassPeriods (ticket 33)", () => {
  it("exactly seven days (11 to 17 Nov): one glass per day, each with that day's running totals", () => {
    expect(glassPeriods(series("2026-11-11", 7))).toEqual([
      { from: "2026-11-11", to: "2026-11-11", savedPence: 100, investedPence: 10 },
      { from: "2026-11-12", to: "2026-11-12", savedPence: 200, investedPence: 20 },
      { from: "2026-11-13", to: "2026-11-13", savedPence: 300, investedPence: 30 },
      { from: "2026-11-14", to: "2026-11-14", savedPence: 400, investedPence: 40 },
      { from: "2026-11-15", to: "2026-11-15", savedPence: 500, investedPence: 50 },
      { from: "2026-11-16", to: "2026-11-16", savedPence: 600, investedPence: 60 },
      { from: "2026-11-17", to: "2026-11-17", savedPence: 700, investedPence: 70 },
    ]);
  });

  it("eight days (10 to 17 Nov): still seven glasses, the first (oldest) covering two days", () => {
    expect(glassPeriods(series("2026-11-10", 8))).toEqual([
      { from: "2026-11-10", to: "2026-11-11", savedPence: 200, investedPence: 20 },
      { from: "2026-11-12", to: "2026-11-12", savedPence: 300, investedPence: 30 },
      { from: "2026-11-13", to: "2026-11-13", savedPence: 400, investedPence: 40 },
      { from: "2026-11-14", to: "2026-11-14", savedPence: 500, investedPence: 50 },
      { from: "2026-11-15", to: "2026-11-15", savedPence: 600, investedPence: 60 },
      { from: "2026-11-16", to: "2026-11-16", savedPence: 700, investedPence: 70 },
      { from: "2026-11-17", to: "2026-11-17", savedPence: 800, investedPence: 80 },
    ]);
  });

  it("fourteen days (4 to 17 Nov) share out evenly: two days a glass", () => {
    expect(glassPeriods(series("2026-11-04", 14)).map((g) => [g.from, g.to, g.savedPence])).toEqual([
      ["2026-11-04", "2026-11-05", 200],
      ["2026-11-06", "2026-11-07", 400],
      ["2026-11-08", "2026-11-09", 600],
      ["2026-11-10", "2026-11-11", 800],
      ["2026-11-12", "2026-11-13", 1000],
      ["2026-11-14", "2026-11-15", 1200],
      ["2026-11-16", "2026-11-17", 1400],
    ]);
  });

  it("a long series (15 Jan to 17 Nov, 307 days): seven glasses of 44 or 43 days, longer ones oldest, from the first day to today", () => {
    const s = series("2026-01-15", 307);
    expect(s.days[s.days.length - 1].day).toBe("2026-11-17");
    const glasses = glassPeriods(s);
    const sizes = glasses.map((g) => s.days.findIndex((d) => d.day === g.to) - s.days.findIndex((d) => d.day === g.from) + 1);
    expect(sizes).toEqual([44, 44, 44, 44, 44, 44, 43]);
    expect(glasses[0].from).toBe("2026-01-15");
    expect(glasses[6].to).toBe("2026-11-17");
    expect([glasses[6].savedPence, glasses[6].investedPence]).toEqual([s.savedPence, s.investedPence]);
  });

  it("any length from 7 to 400 days: seven contiguous glasses covering every day once, sizes within one, saved never falling", () => {
    for (let n = 7; n <= 400; n++) {
      const s = series("2026-01-01", n);
      const glasses = glassPeriods(s);
      expect(glasses).toHaveLength(7);
      const index = (day: string) => s.days.findIndex((d) => d.day === day);
      expect(index(glasses[0].from)).toBe(0);
      expect(index(glasses[6].to)).toBe(n - 1);
      const sizes = glasses.map((g) => index(g.to) - index(g.from) + 1);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(n);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      glasses.forEach((g, i) => {
        if (i > 0) {
          expect(index(g.from)).toBe(index(glasses[i - 1].to) + 1);
          expect(g.savedPence).toBeGreaterThanOrEqual(glasses[i - 1].savedPence);
        }
        expect(g.savedPence).toBe(s.days[index(g.to)].savedPence);
      });
    }
  });

  it("local days, as savingsSeries counts them: a press at 23:50 on 11 Nov is the 11th's glass, one at 00:10 on 12 Nov the 12th's", () => {
    const at = (d: Date) => d.getTime();
    const presses = [
      { id: "a", itemId: "coffee", pricePence: 350, at: at(new Date(2026, 10, 11, 23, 50)) },
      { id: "b", itemId: "coffee", pricePence: 600, at: at(new Date(2026, 10, 12, 0, 10)) },
    ];
    const settlements = [{ id: "s", amountPence: 350, at: at(new Date(2026, 10, 16, 23, 59)) }];
    const glasses = glassPeriods(savingsSeries(presses, settlements, new Date(2026, 10, 17, 0, 5)));
    expect(glasses.map((g) => [g.from, g.savedPence, g.investedPence])).toEqual([
      ["2026-11-11", 350, 0],
      ["2026-11-12", 950, 0],
      ["2026-11-13", 950, 0],
      ["2026-11-14", 950, 0],
      ["2026-11-15", 950, 0],
      ["2026-11-16", 950, 350],
      ["2026-11-17", 950, 350],
    ]);
  });
});

describe("glassPeriods in the first week (ticket 33, Tom's phone test)", () => {
  const now = new Date(2026, 10, 17, 12);
  const pressOn = (day: number, pricePence = 350) => ({
    id: `p${day}`,
    itemId: "coffee",
    pricePence,
    at: new Date(2026, 10, day, 8).getTime(),
  });

  it("one press today: the row starts today on the left, the six glasses after it are days not yet come", () => {
    expect(glassPeriods(savingsSeries([pressOn(17)], [], now))).toEqual([
      { from: "2026-11-17", to: "2026-11-17", savedPence: 350, investedPence: 0 },
      { from: "2026-11-18", to: "2026-11-18", savedPence: 0, investedPence: 0, future: true },
      { from: "2026-11-19", to: "2026-11-19", savedPence: 0, investedPence: 0, future: true },
      { from: "2026-11-20", to: "2026-11-20", savedPence: 0, investedPence: 0, future: true },
      { from: "2026-11-21", to: "2026-11-21", savedPence: 0, investedPence: 0, future: true },
      { from: "2026-11-22", to: "2026-11-22", savedPence: 0, investedPence: 0, future: true },
      { from: "2026-11-23", to: "2026-11-23", savedPence: 0, investedPence: 0, future: true },
    ]);
  });

  it("first press three days ago, a press each day: three glasses filling up, then four not yet come", () => {
    const glasses = glassPeriods(savingsSeries([pressOn(15), pressOn(16), pressOn(17)], [], now));
    expect(glasses.map((g) => [g.from, g.savedPence, g.future ?? false])).toEqual([
      ["2026-11-15", 350, false],
      ["2026-11-16", 700, false],
      ["2026-11-17", 1050, false],
      ["2026-11-18", 0, true],
      ["2026-11-19", 0, true],
      ["2026-11-20", 0, true],
      ["2026-11-21", 0, true],
    ]);
  });

  it("first press six days ago (11 Nov): seven glasses, none not yet come, today the last", () => {
    const glasses = glassPeriods(savingsSeries([pressOn(11), pressOn(17)], [], now));
    expect(glasses.map((g) => g.from)).toEqual(["2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"]);
    expect(glasses.some((g) => g.future)).toBe(false);
  });

  it("first press seven or more days ago: unchanged, the series already starts on the first press day", () => {
    for (const first of [10, 3]) {
      const s = savingsSeries([pressOn(first), pressOn(17)], [], now);
      expect(s.days[0].day).toBe(`2026-11-${String(first).padStart(2, "0")}`);
      const glasses = glassPeriods(s);
      expect(glasses).toHaveLength(7);
      expect(glasses.some((g) => g.future)).toBe(false);
      expect(glasses[0].from).toBe(s.days[0].day);
      expect(glasses[6].to).toBe("2026-11-17");
    }
  });

  it("the graph says which glass is today's: one press today makes it glass 0, and there is no right label while later glasses are still to come", () => {
    const graph = latteGraph(savingsSeries([pressOn(17)], [], now))!;
    expect(graph.todayIndex).toBe(0);
    expect(graph.lastLabel).toBe("");
  });

  it("first press six days ago: today is the last glass (index 6) and the right label is back to 'today'; the text alternative is unchanged", () => {
    const graph = latteGraph(savingsSeries([pressOn(11), pressOn(17)], [], now))!;
    expect(graph.todayIndex).toBe(6);
    expect(graph.lastLabel).toBe("today");
    expect(graph.alt).toBe("Savings over time: £7 saved, £0 invested.");
  });

  it("day three: today's glass is index 2; the text alternative still states the two figures", () => {
    const graph = latteGraph(savingsSeries([pressOn(15), pressOn(16), pressOn(17)], [], now))!;
    expect(graph.todayIndex).toBe(2);
    expect(graph.alt).toBe("Savings over time: £10.50 saved, £0 invested.");
  });
});

describe("glassFill (ticket 33)", () => {
  it("£50 saved of today's £100 in a 100-high glass: froth top at 50; under 8 of froth, £25 invested of £50 splits the 42 evenly", () => {
    expect(glassFill({ savedPence: 5000, investedPence: 2500 }, 10000, 100, 8)).toEqual({
      savedHeight: 50,
      frothHeight: 8,
      latteHeight: 21,
      coffeeHeight: 21,
    });
  });

  it("the last glass holds today's total, so it is always full", () => {
    expect(glassFill({ savedPence: 38130, investedPence: 33720 }, 38130, 120, 8).savedHeight).toBe(120);
  });

  it("a glass with nothing invested shows latte and froth only", () => {
    expect(glassFill({ savedPence: 2800, investedPence: 0 }, 2800, 100, 8)).toEqual({
      savedHeight: 100,
      frothHeight: 8,
      latteHeight: 92,
      coffeeHeight: 0,
    });
  });

  it("a period with nothing saved yet shows an empty glass", () => {
    expect(glassFill({ savedPence: 0, investedPence: 0 }, 2800, 100, 8)).toEqual({
      savedHeight: 0,
      frothHeight: 0,
      latteHeight: 0,
      coffeeHeight: 0,
    });
  });

  it("a glass shallower than the froth is all froth (3 of 100 with froth 8: froth 3, nothing under it)", () => {
    expect(glassFill({ savedPence: 300, investedPence: 0 }, 10000, 100, 8)).toEqual({
      savedHeight: 3,
      frothHeight: 3,
      latteHeight: 0,
      coffeeHeight: 0,
    });
  });
});

describe("latteGraph (ticket 33)", () => {
  it("no presses: no graph", () => {
    expect(latteGraph(savingsSeries([], [], new Date(2026, 10, 17, 12)))).toBeNull();
  });

  it("labels from the series' figures, pence only when there are any; '£0 invested' before the first invest", () => {
    const presses = [
      { id: "a", itemId: "coffee", pricePence: 2450, at: new Date(2026, 10, 12, 8).getTime() },
      { id: "b", itemId: "coffee", pricePence: 350, at: new Date(2026, 10, 17, 8).getTime() },
    ];
    const graph = latteGraph(savingsSeries(presses, [], new Date(2026, 10, 17, 12)))!;
    expect(graph.savedLabel).toBe("£28 saved");
    expect(graph.investedLabel).toBe("£0 invested");
  });

  it("under the tray: the first glass's month on the left, 'today' on the right (series from 15 Jun reads 'Jun')", () => {
    const presses = [{ id: "a", itemId: "coffee", pricePence: 350, at: new Date(2026, 5, 15, 8).getTime() }];
    const graph = latteGraph(savingsSeries(presses, [], new Date(2026, 10, 17, 12)))!;
    expect(graph.firstLabel).toBe("Jun");
    expect(graph.lastLabel).toBe("today");
  });

  it("a text alternative states the two figures", () => {
    const presses = [{ id: "a", itemId: "coffee", pricePence: 38130, at: new Date(2026, 5, 15, 8).getTime() }];
    const settlements = [{ id: "s", amountPence: 33720, at: new Date(2026, 9, 26, 8).getTime() }];
    const graph = latteGraph(savingsSeries(presses, settlements, new Date(2026, 10, 17, 12)))!;
    expect(graph.alt).toBe("Savings over time: £381.30 saved, £337.20 invested.");
  });
});
