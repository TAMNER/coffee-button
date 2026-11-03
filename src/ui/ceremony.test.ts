import { describe, expect, it } from "vitest";
import { FakeAudio } from "../adapters/audio";
import { FakeHaptics } from "../adapters/haptics";
import { Ceremony, instantStage } from "./ceremony";

describe("Ceremony.play", () => {
  it("plays the coin sound once and taps the haptic once per play", async () => {
    const audio = new FakeAudio();
    const haptics = new FakeHaptics();
    await new Ceremony(instantStage).play({ audio, haptics });
    expect(audio.coins).toBe(1);
    expect(haptics.taps).toBe(1);
  });
});
