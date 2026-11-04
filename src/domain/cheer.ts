/** Banner phrases flashed after the coin lands. Short, cheery, no exclamation overload. */
export const CHEER_PHRASES: readonly string[] = [
  "Well done!",
  "Nice one!",
  "Skipped it!",
  "Saved!",
  "Woohoo!",
  "That's the way!",
  "Future you says thanks",
  "Ka-ching!",
];

/** The phrase for a play, picked by its seed so a play is reproducible. */
export function cheerPhrase(seed: number): string {
  return CHEER_PHRASES[Math.abs(seed | 0) % CHEER_PHRASES.length];
}
