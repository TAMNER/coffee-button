import { describe, expect, it, vi } from "vitest";
import { FakeAudio } from "../adapters/audio";
import { Ledger } from "../domain/ledger";
import { MemoryStore, type Press } from "../domain/store";
import { createBus } from "./app";
import { vesselFor } from "./art/vessels";
import { Ceremony, instantStage, wireCeremony, type Stage } from "./ceremony";

describe("Ceremony.play", () => {
  it("plays the coin sound once per play (the haptic is the cup tap's job, inside the gesture)", async () => {
    const audio = new FakeAudio();
    await new Ceremony(instantStage).play({ audio });
    expect(audio.coins).toBe(1);
  });

  it("is identical every press: two plays give the same steps, the clink as the coin lands, ~2 s in all", async () => {
    const log: string[][] = [];
    for (let play = 0; play < 2; play++) {
      const events: string[] = [];
      const recording: Stage = { step: async (step) => void events.push(`${step.name} ${step.durationMs}ms`) };
      const audio = {
        playPour: (ms: number) => void events.push(`pour-sound ${ms}ms`),
        playCoin: () => void events.push("clink"),
        playCheer: () => void events.push("woohoo"),
      };
      await new Ceremony(recording).play({ audio });
      log.push(events);
    }

    // The pour sound starts with the pour and swells into the clink; the cheer starts with the confetti.
    expect(log[0]).toEqual(["pour-sound 800ms", "pour 800ms", "coin 500ms", "clink", "woohoo", "cheer 700ms"]);
    expect(log[1]).toEqual(log[0]);
  });

  it("for a vessel with no pour (Lunch's plate) plays coin, the clink, then cheer, and no pour", async () => {
    const events: string[] = [];
    const recording: Stage = { step: async (step) => void events.push(`${step.name} ${step.durationMs}ms`) };
    const audio = {
      playPour: (ms: number) => void events.push(`pour-sound ${ms}ms`),
      playCoin: () => void events.push("clink"),
      playCheer: () => void events.push("woohoo"),
    };

    await new Ceremony(recording, { pour: false }).play({ audio });

    expect(events).toEqual(["coin 500ms", "clink", "woohoo", "cheer 700ms"]);
  });

  it("for the jar (ticket 28) plays coin, the clink, then cheer, and no pour sound", async () => {
    const events: string[] = [];
    const recording: Stage = { step: async (step) => void events.push(step.name) };
    const audio = {
      playPour: () => void events.push("pour-sound"),
      playCoin: () => void events.push("clink"),
      playCheer: () => void events.push("woohoo"),
    };

    await new Ceremony(recording, { pour: vesselFor("jar").pour }).play({ audio });

    expect(events).toEqual(["coin", "clink", "woohoo", "cheer"]);
  });

  for (const icon of ["pastry", "bag"]) {
    it(`for the ${icon} (ticket 29) plays coin, the clink, then cheer, and no pour sound`, async () => {
      const events: string[] = [];
      const recording: Stage = { step: async (step) => void events.push(step.name) };
      const audio = {
        playPour: () => void events.push("pour-sound"),
        playCoin: () => void events.push("clink"),
        playCheer: () => void events.push("woohoo"),
      };

      await new Ceremony(recording, { pour: vesselFor(icon).pour }).play({ audio });

      expect(events).toEqual(["coin", "clink", "woohoo", "cheer"]);
    });
  }

  it("still resolves when audio throws", async () => {
    const audio = new FakeAudio();
    audio.fail = true;
    await expect(new Ceremony(instantStage).play({ audio })).resolves.toBeUndefined();
    expect(audio.coins).toBe(1);
  });

  it("completes two plays started 50 ms apart (rapid double tap)", async () => {
    vi.useFakeTimers();
    try {
      const timedStage: Stage = {
        step: (step) => new Promise((resolve) => setTimeout(resolve, step.durationMs)),
      };
      const ceremony = new Ceremony(timedStage);
      const audio = new FakeAudio();
      const done: string[] = [];

      const first = ceremony.play({ audio }).then(() => done.push("first"));
      await vi.advanceTimersByTimeAsync(50);
      const second = ceremony.play({ audio }).then(() => done.push("second"));
      await vi.advanceTimersByTimeAsync(3000);

      await expect(Promise.all([first, second])).resolves.toBeDefined();
      expect(done).toEqual(["first", "second"]);
      expect(audio.coins).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("wireCeremony", () => {
  it("plays on the press event, by which time the press is already persisted", async () => {
    const store = new MemoryStore();
    const ledger = new Ledger(store, () => "p1");
    const bus = createBus();
    const seenInStore: (Press | undefined)[] = [];
    const fakeCeremony = {
      play: async () => {
        seenInStore.push(await store.presses.get("p1"));
      },
    };
    wireCeremony(bus, fakeCeremony, { audio: new FakeAudio() });

    // The cup's press handler (src/ui/cup.ts) does exactly this: persist, then emit.
    const at = new Date(2026, 10, 3, 9, 0);
    const press = await ledger.addPress("coffee", at);
    bus.emit("press", { press });
    await Promise.resolve();

    expect(seenInStore).toEqual([{ id: "p1", itemId: "coffee", pricePence: 350, at: at.getTime() }]);
  });
});
