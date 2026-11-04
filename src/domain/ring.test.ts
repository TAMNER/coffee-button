import { describe, expect, it } from "vitest";
import { BEER_ITEM, DEFAULT_ITEM } from "./store";
import { ringLabel } from "./ring";

describe("ringLabel", () => {
  it("names the item in capitals with its price in pounds", () => {
    expect(ringLabel(DEFAULT_ITEM)).toBe("COFFEE £3.50");
    expect(ringLabel(BEER_ITEM)).toBe("BEER £6.00");
  });
});
