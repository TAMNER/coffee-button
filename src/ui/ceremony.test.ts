import { describe, expect, it, vi } from "vitest";
import { FakeAudio } from "../adapters/audio";
import { FakeHaptics } from "../adapters/haptics";
import { Ceremony, instantStage, type Stage } from "./ceremony";

describe("Ceremony.play", () => {
  it("plays the coin sound once and taps the haptic once per play", async () => {
    const audio = new FakeAudio();
    const haptics = new FakeHaptics();
    await new Ceremony(instantStage).play({ audio, haptics });
    expect(audio.coins).toBe(1);
    expect(haptics.taps).toBe(1);
  });

  it("still resolves when audio and haptics throw", async () => {
    const audio = new FakeAudio();
    const haptics = new FakeHaptics();
    audio.fail = true;
    haptics.fail = true;
    await expect(new Ceremony(instantStage).play({ audio, haptics })).resolves.toBeUndefined();
    expect(audio.coins).toBe(1);
    expect(haptics.taps).toBe(1);
  });

  it("completes two plays started 50 ms apart (rapid double tap)", async () => {
    vi.useFakeTimers();
    try {
      const timedStage: Stage = {
        step: (step) => new Promise((resolve) => setTimeout(resolve, step.durationMs)),
      };
      const ceremony = new Ceremony(timedStage);
      const audio = new FakeAudio();
      const haptics = new FakeHaptics();
      const done: string[] = [];

      const first = ceremony.play({ audio, haptics }).then(() => done.push("first"));
      await vi.advanceTimersByTimeAsync(50);
      const second = ceremony.play({ audio, haptics }).then(() => done.push("second"));
      await vi.advanceTimersByTimeAsync(3000);

      await expect(Promise.all([first, second])).resolves.toBeDefined();
      expect(done).toEqual(["first", "second"]);
      expect(audio.coins).toBe(2);
      expect(haptics.taps).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
