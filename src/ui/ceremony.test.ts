import { describe, expect, it, vi } from "vitest";
import { FakeAudio } from "../adapters/audio";
import { Ledger } from "../domain/ledger";
import { MemoryStore, type Press } from "../domain/store";
import { createBus } from "./app";
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
      const audio = { playCoin: () => void events.push("clink") };
      await new Ceremony(recording).play({ audio });
      log.push(events);
    }

    expect(log[0]).toEqual(["pour 800ms", "coin 500ms", "clink", "cheer 700ms"]);
    expect(log[1]).toEqual(log[0]);
  });

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
