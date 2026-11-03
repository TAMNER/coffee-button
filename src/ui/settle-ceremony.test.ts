import { describe, expect, it } from "vitest";
import { FakeClipboard } from "../adapters/clipboard";
import { FakeClock } from "../adapters/clock";
import { FakeUrlOpener } from "../adapters/open-url";
import { InvestFlow } from "../domain/settle";
import { MemoryStore, type Settlement } from "../domain/store";
import { createBus } from "./app";
import { wireSettleCeremony } from "./settle-ceremony";

describe("wireSettleCeremony", () => {
  it("plays on the settle event, by which time the settlement is already persisted", async () => {
    const store = new MemoryStore();
    const bus = createBus();
    const seenInStore: Settlement[][] = [];
    wireSettleCeremony(bus, store, {
      play: async () => {
        seenInStore.push(await store.settlements.list());
      },
    });

    // The Yes handler in src/ui/settle.ts does exactly this: InvestFlow persists, then onSettled emits.
    const flow = new InvestFlow({
      store,
      clock: new FakeClock(new Date(2026, 10, 26, 9, 0)),
      clipboard: new FakeClipboard(),
      opener: new FakeUrlOpener(),
      onSettled: (settlement) => bus.emit("settle", { settlement }),
    });
    await flow.invest(1250);
    const settlement = await flow.yes();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(seenInStore).toEqual([
      [{ id: settlement!.id, amountPence: 1250, at: new Date(2026, 10, 26, 9, 0).getTime() }],
    ]);
  });
});
