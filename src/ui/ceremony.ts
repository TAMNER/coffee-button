import type { Audio } from "../adapters/audio";
import type { Haptics } from "../adapters/haptics";
import { ceremonyTimeline, type CeremonyStep } from "../domain/ceremony-timeline";

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

/** Sound and haptics are garnish: where they fail, the ceremony carries on silently. */
function quietly(fn: () => void): void {
  try {
    fn();
  } catch {
    // unsupported or blocked on this device
  }
}
