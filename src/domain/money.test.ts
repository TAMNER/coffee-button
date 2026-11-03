import { describe, expect, it } from "vitest";
import { formatPounds } from "./money";

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
