import { describe, expect, it } from "vitest";
import { paceToYearEnd } from "./projections";

const press = (pricePence: number, at: Date) => ({ id: String(at.getTime()), itemId: "coffee", pricePence, at: at.getTime() });

describe("paceToYearEnd", () => {
  it("£120 saved by 31 March (day 90 of 365) projects to £486.67 by 31 December", () => {
    const presses = [press(6000, new Date(2026, 0, 10, 9)), press(6000, new Date(2026, 2, 31, 8))];
    expect(paceToYearEnd(presses, new Date(2026, 2, 31, 12))).toBe(48667);
  });
});
