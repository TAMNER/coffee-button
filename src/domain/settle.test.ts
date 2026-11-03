import { describe, expect, it } from "vitest";
import { owed } from "./settle";
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
});
