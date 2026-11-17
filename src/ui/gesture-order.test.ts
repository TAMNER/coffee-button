// Ticket 23 guard: the vibration tick never waits on sound. iOS drops a haptic
// that comes after the first await in a tap handler, and the tick must fire
// whatever the ringer switch says, so it comes first in the press and settle
// handlers. The handlers are DOM glue, so this reads their source.
import { describe, expect, it } from "vitest";
import cupSource from "./cup.ts?raw";
import settleSource from "./settle.ts?raw";

/** The handler body from `opening` up to its first await. */
function beforeFirstAwait(source: string, opening: string): string {
  const start = source.indexOf(opening);
  expect(start).toBeGreaterThanOrEqual(0);
  const body = source.slice(start + opening.length);
  const firstAwait = body.indexOf("await ");
  expect(firstAwait).toBeGreaterThan(0);
  return body.slice(0, firstAwait);
}

describe("vibration ticks fire inside the gesture, before any await", () => {
  it("the cup press ticks before its first await, and before audio is touched", () => {
    const head = beforeFirstAwait(cupSource, 'cup.addEventListener("click", async () => {');
    expect(head).toContain("deviceHaptics().tap();");
    expect(head.indexOf("deviceHaptics().tap();")).toBeLessThan(head.indexOf("deviceAudio()"));
  });

  it("the settle Yes ticks before its first await", () => {
    const head = beforeFirstAwait(settleSource, 'yesButton.addEventListener("click", async () => {');
    expect(head).toContain("deviceHaptics().tap();");
  });
});
