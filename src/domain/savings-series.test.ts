import { describe, expect, it } from "vitest";
import { savingsSeries } from "./savings-series";

describe("savingsSeries", () => {
  it("no presses gives no series and zero headline figures", () => {
    expect(savingsSeries([], [], new Date(2026, 10, 17, 12))).toEqual({ days: [], savedPence: 0, investedPence: 0 });
  });
});
