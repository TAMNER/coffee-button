import { describe, expect, it } from "vitest";
import { savingsSeries } from "./savings-series";

let n = 0;
const press = (pricePence: number, at: Date, itemId = "coffee") => ({ id: `p${++n}`, itemId, pricePence, at: at.getTime() });

describe("savingsSeries", () => {
  it("no presses gives no series and zero headline figures", () => {
    expect(savingsSeries([], [], new Date(2026, 10, 17, 12))).toEqual({ days: [], savedPence: 0, investedPence: 0 });
  });

  it("one press today (17 Nov, £3.50) gives seven days, 11 to 17 Nov, with saved stepping up on the 17th", () => {
    const series = savingsSeries([press(350, new Date(2026, 10, 17, 8))], [], new Date(2026, 10, 17, 12));
    expect(series.days).toEqual([
      { day: "2026-11-11", savedPence: 0, investedPence: 0 },
      { day: "2026-11-12", savedPence: 0, investedPence: 0 },
      { day: "2026-11-13", savedPence: 0, investedPence: 0 },
      { day: "2026-11-14", savedPence: 0, investedPence: 0 },
      { day: "2026-11-15", savedPence: 0, investedPence: 0 },
      { day: "2026-11-16", savedPence: 0, investedPence: 0 },
      { day: "2026-11-17", savedPence: 350, investedPence: 0 },
    ]);
    expect(series.savedPence).toBe(350);
    expect(series.investedPence).toBe(0);
  });
});
