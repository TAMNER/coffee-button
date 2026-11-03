import { describe, expect, it } from "vitest";
import { FakeClipboard } from "../adapters/clipboard";
import { FakeClock } from "../adapters/clock";
import { FakeUrlOpener } from "../adapters/open-url";
import type { SettleCeremonyPlan } from "../domain/settle-ceremony";
import { MemoryStore, type Settlement } from "../domain/store";
import { createBus } from "./app";
import { createInvestFlow } from "./settle";
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

    // The same factory the Invest button uses (src/ui/settle.ts).
    const flow = createInvestFlow(
      { store, bus, clock: new FakeClock(new Date(2026, 10, 26, 9, 0)) },
      new FakeClipboard(),
      new FakeUrlOpener(),
    );
    await flow.invest(1250);
    const settlement = await flow.yes();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(seenInStore).toEqual([
      [{ id: settlement!.id, amountPence: 1250, at: new Date(2026, 10, 26, 9, 0).getTime() }],
    ]);
  });

  it("plays 3 coins for the 3 presses settled, ticking the lifetime invested from £24.00 to £36.50", async () => {
    const store = new MemoryStore();
    const bus = createBus();
    const plans: SettleCeremonyPlan[] = [];
    wireSettleCeremony(bus, store, {
      play: async (plan) => {
        plans.push(plan);
      },
    });
    const at = (month: number, day: number) => new Date(2026, month, day, 9, 0).getTime();
    await store.presses.put({ id: "oct", itemId: "coffee", pricePence: 2400, at: at(9, 3) });
    await store.settlements.put({ id: "s-oct", amountPence: 2400, at: at(9, 26) });
    await store.presses.put({ id: "n1", itemId: "coffee", pricePence: 350, at: at(10, 2) });
    await store.presses.put({ id: "n2", itemId: "coffee", pricePence: 350, at: at(10, 9) });
    await store.presses.put({ id: "n3", itemId: "beer", pricePence: 550, at: at(10, 20) });
    const settlement = { id: "s-nov", amountPence: 1250, at: at(10, 26) };
    await store.settlements.put(settlement);

    bus.emit("settle", { settlement });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(plans).toEqual([{ coins: 3, fromPence: 2400, toPence: 3650 }]);
  });
});
