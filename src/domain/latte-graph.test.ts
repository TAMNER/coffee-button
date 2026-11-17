import { describe, expect, it } from "vitest";
import { glassPeriods } from "./latte-graph";
import type { SavingsDay, SavingsSeries } from "./savings-series";

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

  it("day eight (Tue 10 to Tue 17 Nov): one glass per Monday-to-Sunday week, the last being this week so far", () => {
    expect(glassPeriods(series("2026-11-10", 8))).toEqual([
      { from: "2026-11-10", to: "2026-11-15", savedPence: 600, investedPence: 60 },
      { from: "2026-11-16", to: "2026-11-17", savedPence: 800, investedPence: 80 },
    ]);
  });

  it("exactly seven weeks touched (Mon 5 Oct to Tue 17 Nov, 44 days): seven weekly glasses", () => {
    const glasses = glassPeriods(series("2026-10-05", 44));
    expect(glasses.map((g) => [g.from, g.to, g.savedPence])).toEqual([
      ["2026-10-05", "2026-10-11", 700],
      ["2026-10-12", "2026-10-18", 1400],
      ["2026-10-19", "2026-10-25", 2100],
      ["2026-10-26", "2026-11-01", 2800],
      ["2026-11-02", "2026-11-08", 3500],
      ["2026-11-09", "2026-11-15", 4200],
      ["2026-11-16", "2026-11-17", 4400],
    ]);
  });

  it("an eighth week touched (Sun 4 Oct to Tue 17 Nov): one glass per calendar month, split at the month boundary, the last being this month so far", () => {
    expect(glassPeriods(series("2026-10-04", 45))).toEqual([
      { from: "2026-10-04", to: "2026-10-31", savedPence: 2800, investedPence: 280 },
      { from: "2026-11-01", to: "2026-11-17", savedPence: 4500, investedPence: 450 },
    ]);
  });

  it("more than seven months (15 Jan to 17 Nov): only the most recent seven, May to November", () => {
    const s = series("2026-01-15", 307); // 15 Jan to 17 Nov 2026
    expect(s.days[s.days.length - 1].day).toBe("2026-11-17");
    const glasses = glassPeriods(s);
    expect(glasses.map((g) => [g.from, g.to])).toEqual([
      ["2026-05-01", "2026-05-31"],
      ["2026-06-01", "2026-06-30"],
      ["2026-07-01", "2026-07-31"],
      ["2026-08-01", "2026-08-31"],
      ["2026-09-01", "2026-09-30"],
      ["2026-10-01", "2026-10-31"],
      ["2026-11-01", "2026-11-17"],
    ]);
    expect(glasses[6].savedPence).toBe(30700);
  });
});
