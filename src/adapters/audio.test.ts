// Ticket 23: sounds respect the iPhone's ringer switch and leave other apps' music playing.
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebAudioCoin } from "./audio";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WebAudioCoin.unlock and the audio session", () => {
  it("asks for the ambient session by name: the ringer switch still mutes it and other apps' music keeps playing", () => {
    const audioSession = { type: "auto" };
    vi.stubGlobal("navigator", { audioSession });
    new WebAudioCoin().unlock();
    expect(audioSession.type).toBe("ambient");
  });
});
