import { describe, expect, it } from "vitest";
import { CHEER_PHRASES, cheerPhrase } from "./cheer";

describe("cheerPhrase", () => {
  it("is one of the phrases, chosen by the play's seed, so the same seed gives the same banner", () => {
    expect(CHEER_PHRASES).toContain(cheerPhrase(7));
    expect(cheerPhrase(7)).toBe(cheerPhrase(7));
  });
});
