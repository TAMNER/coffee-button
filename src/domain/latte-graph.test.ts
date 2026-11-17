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
});
