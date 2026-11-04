export interface SpaceLineInput {
  owedPence: number;
  waitingPence: number;
  /** The linked Space's name, or null when no Space is linked. */
  spaceName: string | null;
}

/** The line under "Invest £X" about the Space, or null when none is linked. */
export function spaceLine(input: SpaceLineInput): string | null {
  if (input.spaceName === null) return null;
  return "";
}
