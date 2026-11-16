import { describe, expect, it } from "vitest";
import { compound, paceToYearEnd } from "./projections";

const press = (pricePence: number, at: Date) => ({ id: String(at.getTime()), itemId: "coffee", pricePence, at: at.getTime() });

describe("paceToYearEnd", () => {
  it("£120 saved by 31 March, first press 1 January (day 90 of 365), projects to £486.67 by 31 December", () => {
    const presses = [press(6000, new Date(2026, 0, 1, 9)), press(6000, new Date(2026, 2, 31, 8))];
    expect(paceToYearEnd(presses, new Date(2026, 2, 31, 12))).toBe(48667);
  });
});

describe("paceToYearEnd edge days", () => {
  it("in a leap year, £120 by 31 March with presses since last year (day 91 of 366) projects to £482.64", () => {
    // 12000 / 91 * 366 = 48263.74 pence; last year's £3.50 only moves the window start back to 1 January
    const presses = [press(350, new Date(2027, 11, 30, 8)), press(12000, new Date(2028, 2, 31, 8))];
    expect(paceToYearEnd(presses, new Date(2028, 2, 31, 12))).toBe(48264);
  });

  it("on 1 January, £3.50 that morning projects to 365 times that: £1277.50", () => {
    const presses = [press(350, new Date(2026, 0, 1, 8))];
    expect(paceToYearEnd(presses, new Date(2026, 0, 1, 12))).toBe(127750);
  });
});

describe("paceToYearEnd from the first press", () => {
  it("5 coffees on 12 to 16 Nov (£17.50) project over the 50 days 12 Nov to 31 Dec: £175.00, not £19.96", () => {
    const presses = [12, 13, 14, 15, 16].map((d) => press(350, new Date(2026, 10, d, 8)));
    expect(paceToYearEnd(presses, new Date(2026, 10, 16, 12))).toBe(17500);
  });
});

describe("compound", () => {
  it("£100 at 5% for 10 years is £162.89 and £240 is £390.93 (1.05^10 = 1.62889)", () => {
    expect(compound(10000, 0.05, 10)).toBe(16289);
    expect(compound(24000, 0.05, 10)).toBe(39093);
  });
});
