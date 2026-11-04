import { describe, expect, it } from "vitest";
import { INFO_SECTIONS } from "./info";

describe("info sheet copy", () => {
  it("has exactly four sections: The idea, The money, Swipe, Add to Home Screen", () => {
    expect(INFO_SECTIONS.map((s) => s.heading)).toEqual(["The idea", "The money", "Swipe", "Add to Home Screen"]);
  });
});
