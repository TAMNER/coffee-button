import { describe, expect, it } from "vitest";
import { isSettleWindow, owed, owedSince, settle } from "./settle";
import { MemoryStore } from "./store";

const press = (id: string, pricePence: number, at: Date) => ({ id, itemId: "coffee", pricePence, at: at.getTime() });

describe("owed", () => {
  it("is only the presses after the last settlement: settled 26 Sep and 26 Oct, so Oct 30 350 + Nov 2 600 = 950", async () => {
    const store = new MemoryStore();
    await store.presses.put(press("a", 350, new Date(2026, 8, 10, 9, 0)));
    await store.presses.put(press("b", 350, new Date(2026, 9, 20, 9, 0)));
    await store.presses.put(press("c", 350, new Date(2026, 9, 30, 9, 0)));
    await store.presses.put(press("d", 600, new Date(2026, 10, 2, 18, 0)));
    await store.settlements.put({ id: "s2", amountPence: 350, at: new Date(2026, 9, 26, 8, 0).getTime() });
    await store.settlements.put({ id: "s1", amountPence: 350, at: new Date(2026, 8, 26, 8, 0).getTime() });

    expect(await owed(store, new Date(2026, 10, 3, 12, 0))).toBe(950);
  });

  it("is every press when nothing has been settled: Oct 20 350 + Oct 30 350 + Nov 2 600 = 1300", async () => {
    const store = new MemoryStore();
    await store.presses.put(press("a", 350, new Date(2026, 9, 20, 9, 0)));
    await store.presses.put(press("b", 350, new Date(2026, 9, 30, 9, 0)));
    await store.presses.put(press("c", 600, new Date(2026, 10, 2, 18, 0)));

    expect(await owed(store, new Date(2026, 10, 3, 12, 0))).toBe(1300);
  });
});

describe("settle", () => {
  it("records £12.50 on 26 Nov and leaves nothing owed afterwards", async () => {
    const store = new MemoryStore();
    await store.presses.put(press("a", 350, new Date(2026, 10, 2, 9, 0)));
    await store.presses.put(press("b", 900, new Date(2026, 10, 20, 9, 0)));
    const at = new Date(2026, 10, 26, 9, 0);

    const settlement = await settle(store, 1250, at);

    expect(await store.settlements.list()).toEqual([
      { id: settlement.id, amountPence: 1250, at: new Date(2026, 10, 26, 9, 0).getTime() },
    ]);
    expect(await owed(store, new Date(2026, 10, 26, 9, 1))).toBe(0);
  });
});

describe("owedSince", () => {
  it("is the oldest press after the last settlement: settled 26 Oct, presses 30 Oct and 2 Nov, so 30 Oct", async () => {
    const store = new MemoryStore();
    await store.presses.put(press("a", 350, new Date(2026, 9, 20, 9, 0)));
    await store.presses.put(press("d", 600, new Date(2026, 10, 2, 18, 0)));
    await store.presses.put(press("c", 350, new Date(2026, 9, 30, 9, 0)));
    await store.settlements.put({ id: "s", amountPence: 350, at: new Date(2026, 9, 26, 8, 0).getTime() });

    expect(await owedSince(store, new Date(2026, 10, 3, 12, 0))).toEqual(new Date(2026, 9, 30, 9, 0));
  });
});

describe("isSettleWindow (payday 25)", () => {
  it("is open from 00:00 on 26 Nov while £12.50 is owed from 2 Nov", () => {
    expect(isSettleWindow(new Date(2026, 10, 26, 0, 0), 25, new Date(2026, 10, 2, 9, 0), 1250)).toBe(true);
  });

  it("is closed on 28 Nov when nothing is owed", () => {
    expect(isSettleWindow(new Date(2026, 10, 28, 12, 0), 25, null, 0)).toBe(false);
  });

  it("is closed at 23:59 on payday 25 Nov when everything owed is from November", () => {
    expect(isSettleWindow(new Date(2026, 10, 25, 23, 59), 25, new Date(2026, 10, 2, 9, 0), 1250)).toBe(false);
  });

  it("stays open on 3 Nov when £12.50 owed from 20 Oct rolled over unsettled", () => {
    expect(isSettleWindow(new Date(2026, 10, 3, 12, 0), 25, new Date(2026, 9, 20, 9, 0), 1250)).toBe(true);
  });
});
