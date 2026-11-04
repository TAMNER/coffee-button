/** Banner phrases flashed after the coin lands. Tom's list (2026-11-04): short so they fit consistently. */
export const CHEER_PHRASES: readonly string[] = [
  "Skipped it",
  "Saved it",
  "Bopped it",
  "Ka-ching!",
  "Dolla dolla!",
  "Noice!",
  "Yeah boi",
  "Kapow!",
  "That's right",
  "Good job",
  "Take that!",
];

/** The phrase for a play, picked by its seed so a play is reproducible. */
export function cheerPhrase(seed: number): string {
  return CHEER_PHRASES[Math.abs(seed | 0) % CHEER_PHRASES.length];
}
