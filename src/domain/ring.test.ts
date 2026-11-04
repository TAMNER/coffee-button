import { describe, expect, it } from "vitest";
import { setActiveItem } from "./settings";
import { BEER_ITEM, DEFAULT_ITEM, MemoryStore } from "./store";
import { activeRingLabel, ringLabel } from "./ring";

describe("ringLabel", () => {
  it("names the item in capitals with its price in pounds", () => {
    expect(ringLabel(DEFAULT_ITEM)).toBe("COFFEE £3.50");
    expect(ringLabel(BEER_ITEM)).toBe("BEER £6.00");
  });
});

describe("activeRingLabel", () => {
  it("labels the stored active item at its current price, so a reprice shows on the next mount", async () => {
    const store = new MemoryStore();
    expect(await activeRingLabel(store)).toBe("COFFEE £3.50");
    await store.items.put({ ...DEFAULT_ITEM, pricePence: 420 });
    expect(await activeRingLabel(store)).toBe("COFFEE £4.20");
    await setActiveItem(store, BEER_ITEM.id);
    expect(await activeRingLabel(store)).toBe("BEER £6.00");
  });
});
