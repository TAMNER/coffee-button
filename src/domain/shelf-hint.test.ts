import { describe, expect, it } from "vitest";
import { shelfHint } from "./shelf-hint";

describe("shelfHint", () => {
  it("before the first press the shelf shows the hint instead of £0.00 sums", () => {
    expect(shelfHint([])).toBe("Tap the cup every time you walk past the café.");
  });
});
