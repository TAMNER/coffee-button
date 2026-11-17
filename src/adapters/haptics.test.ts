import { describe, expect, it } from "vitest";
import { FakeHaptics } from "./haptics";

describe("FakeHaptics", () => {
  it("records each pattern it is asked to play, and counts taps apart", () => {
    const haptics = new FakeHaptics();
    haptics.vibrate([15, 100, 60]);
    haptics.tap();
    expect(haptics.patterns).toEqual([[15, 100, 60]]);
    expect(haptics.taps).toBe(1);
  });
});
