import { formatPounds } from "./money";

export interface SpaceLineInput {
  owedPence: number;
  waitingPence: number;
  /** The linked Space's name, or null when no Space is linked. */
  spaceName: string | null;
}

/** The line under "Invest £X" about the Space, or null when none is linked. */
export function spaceLine(input: SpaceLineInput): string | null {
  if (input.spaceName === null) return null;
  if (input.waitingPence > 0) return `${formatPounds(input.waitingPence)} still moving to your Space`;
  return `${formatPounds(input.owedPence)} is waiting in your ${input.spaceName} Space`;
}
