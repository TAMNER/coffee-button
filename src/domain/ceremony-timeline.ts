/** The press ceremony, in order. Identical every press (DESIGN.md: Pavlovian, ~2 s). */
export type CeremonyStepName = "pour" | "coin" | "cheer";

export interface CeremonyStep {
  name: CeremonyStepName;
  durationMs: number;
}

const STEPS: readonly CeremonyStep[] = [
  { name: "pour", durationMs: 800 },
  { name: "coin", durationMs: 500 },
  { name: "cheer", durationMs: 700 },
];

/**
 * The ceremony's steps. A vessel with nothing to pour (Lunch's plate) passes
 * `{ pour: false }` and goes straight to coin, then cheer.
 */
export function ceremonyTimeline(options: { pour?: boolean } = {}): CeremonyStep[] {
  const pour = options.pour ?? true;
  return STEPS.filter((step) => pour || step.name !== "pour").map((step) => ({ ...step }));
}
