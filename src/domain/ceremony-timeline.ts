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

export function ceremonyTimeline(): CeremonyStep[] {
  return STEPS.map((step) => ({ ...step }));
}
