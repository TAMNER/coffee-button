import { describe, expect, it } from "vitest";
import { LedgerMover } from "./money-mover";
import { MemoryStore } from "./store";

describe("LedgerMover", () => {
  it("resolves ok for a £3.50 press and leaves the store untouched, because the ledger already holds the press", async () => {
    const store = new MemoryStore();
    const press = { id: "p1", itemId: "coffee", pricePence: 350, at: Date.UTC(2026, 10, 3, 9, 0) };
    await store.presses.put(press);
    const itemsBefore = await store.items.list();

    const result = await new LedgerMover().move(350, { pressId: "p1" });

    expect(result).toEqual({ ok: true });
    expect(await store.presses.list()).toEqual([press]);
    expect(await store.items.list()).toEqual(itemsBefore);
  });
});
