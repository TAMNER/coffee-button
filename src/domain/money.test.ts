import { describe, expect, it } from "vitest";
import { formatPounds, formatPoundsShort } from "./money";

describe("formatPounds", () => {
  it("formats the default coffee price of 350 pence as £3.50", () => {
    expect(formatPounds(350)).toBe("£3.50");
  });

  it("formats 1205 pence as £12.05, keeping the leading zero in pence", () => {
    expect(formatPounds(1205)).toBe("£12.05");
  });

  it("formats zero as £0.00", () => {
    expect(formatPounds(0)).toBe("£0.00");
  });
});

describe("formatPoundsShort (ticket 33: the latte graph's labels)", () => {
  it("drops the pence when there are none: 2800 is £28, 0 is £0", () => {
    expect(formatPoundsShort(2800)).toBe("£28");
    expect(formatPoundsShort(0)).toBe("£0");
  });

  it("keeps the pence when there are any: 38130 is £381.30, 1205 is £12.05", () => {
    expect(formatPoundsShort(38130)).toBe("£381.30");
    expect(formatPoundsShort(1205)).toBe("£12.05");
  });
});
