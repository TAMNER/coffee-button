import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
import { compound, paceToYearEnd } from "./projections";
import { MemoryStore } from "./store";

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

  it("on 1 January, £3.50 that morning counts as 7 days of 365: £182.50", () => {
    const presses = [press(350, new Date(2026, 0, 1, 8))];
    expect(paceToYearEnd(presses, new Date(2026, 0, 1, 12))).toBe(18250);
  });
});

describe("paceToYearEnd from the first press", () => {
  it("5 coffees on 12 to 16 Nov (£17.50), 5 days counted as 7, project over the 50 days to 31 Dec: £125.00, not £19.96", () => {
    const presses = [12, 13, 14, 15, 16].map((d) => press(350, new Date(2026, 10, d, 8)));
    expect(paceToYearEnd(presses, new Date(2026, 10, 16, 12))).toBe(12500);
  });

  it("five taps on the first day count as at least 7 elapsed days: £17.50 / 7 * 46 = £115.00, not £805.00", () => {
    const presses = [8, 9, 10, 11, 12].map((h) => press(350, new Date(2026, 10, 16, h)));
    expect(paceToYearEnd(presses, new Date(2026, 10, 16, 13))).toBe(11500);
  });

  it("no presses at all is £0.00", () => {
    expect(paceToYearEnd([], new Date(2026, 10, 16, 12))).toBe(0);
  });

  it("a first press today (16 Nov, £3.50) counts as 7 days of the 46 to 31 December: £23.00", () => {
    expect(paceToYearEnd([press(350, new Date(2026, 10, 16, 8))], new Date(2026, 10, 16, 12))).toBe(2300);
  });

  it("a first press in a previous year starts this year's window on 1 January (£17.50 by 16 Nov is £19.96)", () => {
    const presses = [press(350, new Date(2025, 5, 1, 8)), ...[12, 13, 14, 15, 16].map((d) => press(350, new Date(2026, 10, d, 8)))];
    // 1750 / 320 days * 365; last year's £3.50 is not part of this year's total
    expect(paceToYearEnd(presses, new Date(2026, 10, 16, 12))).toBe(1996);
  });

  it("an undone press is gone from the ledger, so it neither counts nor starts the window", async () => {
    let n = 0;
    const ledger = new Ledger(new MemoryStore(), () => `p${++n}`);
    const early = await ledger.addPress("coffee", new Date(2026, 10, 1, 8));
    await ledger.undo(early.id);
    await ledger.addPress("coffee", new Date(2026, 10, 16, 8));
    // As if the 16 Nov press were the first: £3.50 over 7 (the minimum) of 46 days
    expect(paceToYearEnd(await ledger.presses(), new Date(2026, 10, 16, 12))).toBe(2300);
  });

  it("a press dated after now (clock moved back) neither counts nor starts the window", () => {
    const presses = [press(350, new Date(2026, 10, 16, 8)), press(350, new Date(2026, 10, 20, 8))];
    expect(paceToYearEnd(presses, new Date(2026, 10, 16, 12))).toBe(2300);
  });
});

describe("compound", () => {
  it("£100 at 5% for 10 years is £162.89 and £240 is £390.93 (1.05^10 = 1.62889)", () => {
    expect(compound(10000, 0.05, 10)).toBe(16289);
    expect(compound(24000, 0.05, 10)).toBe(39093);
  });
});
