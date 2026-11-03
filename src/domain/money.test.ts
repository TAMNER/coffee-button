import { describe, expect, it } from "vitest";
import { formatPounds } from "./money";

describe("formatPounds", () => {
  it("formats the default coffee price of 350 pence as £3.50", () => {
    expect(formatPounds(350)).toBe("£3.50");
  });
});
