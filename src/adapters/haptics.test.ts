import { describe, expect, it, vi } from "vitest";
import { FakeHaptics, SwitchHaptics } from "./haptics";

describe("FakeHaptics", () => {
  it("records each pattern it is asked to play, and counts taps apart", () => {
    const haptics = new FakeHaptics();
    haptics.vibrate([15, 100, 60]);
    haptics.tap();
    expect(haptics.patterns).toEqual([[15, 100, 60]]);
    expect(haptics.taps).toBe(1);
  });
});

// The switch itself needs a DOM; these tests watch whether it is reached through tap().
const noDocument = {} as Document;

describe("SwitchHaptics.vibrate", () => {
  it("plays the whole pattern through navigator.vibrate where it exists (Android), without the switch", () => {
    const vibrate = vi.fn(() => true);
    const haptics = new SwitchHaptics(noDocument, { vibrate });
    const tap = vi.spyOn(haptics, "tap").mockImplementation(() => {});
    haptics.vibrate([15, 1285, 60]);
    expect(vibrate).toHaveBeenCalledWith([15, 1285, 60]);
    expect(tap).not.toHaveBeenCalled();
  });
});
