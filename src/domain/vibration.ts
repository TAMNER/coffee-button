import type { CeremonyStep } from "./ceremony-timeline";

/**
 * A vibration pattern: alternating vibrate and pause times in ms, starting
 * with vibrate (the shape `navigator.vibrate` takes). The whole pattern is
 * requested once, inside the tap, because only there may a web page vibrate.
 */
export type VibrationPattern = number[];

const TICK_MS = 15;
const LANDING_MS = 60;
/** The flutter starts this long after the landing buzz starts, inside the cheer. */
const FLUTTER_DELAY_MS = 150;
const FLUTTER_ON_MS = 25;
const FLUTTER_OFF_MS = 50;
const FLUTTER_PULSES = 3;

/**
 * The press pattern for one ceremony: a tick at the press, a firmer buzz as
 * the coin lands (the end of the coin step), then a flutter in the cheer.
 */
export function pressVibration(steps: readonly CeremonyStep[]): VibrationPattern {
  const coinEnds = steps.findIndex((s) => s.name === "coin") + 1;
  const landsAt = steps.slice(0, coinEnds).reduce((ms, s) => ms + s.durationMs, 0);
  const pattern = [TICK_MS, landsAt - TICK_MS, LANDING_MS, FLUTTER_DELAY_MS - LANDING_MS];
  for (let i = 0; i < FLUTTER_PULSES; i++) {
    if (i > 0) pattern.push(FLUTTER_OFF_MS);
    pattern.push(FLUTTER_ON_MS);
  }
  return pattern;
}

/**
 * Confirming a settle: a longer celebration than a press. Three quick taps,
 * two firmer beats, then one long buzz to finish (under a second in all).
 */
export function settleVibration(): VibrationPattern {
  return [30, 70, 30, 70, 30, 70, 50, 140, 50, 140, 200];
}
