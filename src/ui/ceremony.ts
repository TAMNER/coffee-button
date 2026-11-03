import type { Audio } from "../adapters/audio";
import type { Haptics } from "../adapters/haptics";
import { ceremonyTimeline, type CeremonyStep } from "../domain/ceremony-timeline";
import type { Bus } from "./app";

export interface CeremonyAdapters {
  audio: Audio;
  haptics: Haptics;
}

/** Draws one step of one play; resolves when that step has finished. */
export interface Stage {
  step(step: CeremonyStep): Promise<void>;
}

/** A stage that draws nothing and takes no time. */
export const instantStage: Stage = { step: async () => {} };

export class Ceremony {
  constructor(private stage: Stage) {}

  async play(adapters: CeremonyAdapters): Promise<void> {
    quietly(() => adapters.haptics.tap());
    for (const step of ceremonyTimeline()) {
      await this.stage.step(step);
      if (step.name === "coin") quietly(() => adapters.audio.playCoin());
    }
  }
}

/**
 * Plays the ceremony on every press. The press event fires only after the press
 * is persisted, so leaving mid-animation loses nothing. Fire and forget: the
 * cup stays tappable while a ceremony runs.
 */
export function wireCeremony(
  bus: Bus,
  ceremony: Pick<Ceremony, "play">,
  adapters: CeremonyAdapters,
): () => void {
  return bus.on("press", () => {
    void ceremony.play(adapters);
  });
}

/** Sound and haptics are garnish: where they fail, the ceremony carries on silently. */
function quietly(fn: () => void): void {
  try {
    fn();
  } catch {
    // unsupported or blocked on this device
  }
}
