import { describe, expect, it } from "vitest";
import { FakeClock } from "../adapters/clock";
import { Ledger } from "./ledger";
import { savingsSeries } from "./savings-series";
import { settle } from "./settle";
import { MemoryStore } from "./store";

let n = 0;
const press = (pricePence: number, at: Date, itemId = "coffee") => ({ id: `p${++n}`, itemId, pricePence, at: at.getTime() });

describe("savingsSeries", () => {
  it("no presses gives no series and zero headline figures", () => {
    expect(savingsSeries([], [], new Date(2026, 10, 17, 12))).toEqual({ days: [], savedPence: 0, investedPence: 0 });
  });

  it("one press today (17 Nov, £3.50) gives seven days, 11 to 17 Nov, with saved stepping up on the 17th", () => {
    const series = savingsSeries([press(350, new Date(2026, 10, 17, 8))], [], new Date(2026, 10, 17, 12));
    expect(series.days).toEqual([
      { day: "2026-11-11", savedPence: 0, investedPence: 0 },
      { day: "2026-11-12", savedPence: 0, investedPence: 0 },
      { day: "2026-11-13", savedPence: 0, investedPence: 0 },
      { day: "2026-11-14", savedPence: 0, investedPence: 0 },
      { day: "2026-11-15", savedPence: 0, investedPence: 0 },
      { day: "2026-11-16", savedPence: 0, investedPence: 0 },
      { day: "2026-11-17", savedPence: 350, investedPence: 0 },
    ]);
    expect(series.savedPence).toBe(350);
    expect(series.investedPence).toBe(0);
  });

  it("saved runs on across items and months; invested steps up on each settlement's day by its amount", () => {
    const presses = [
      press(350, new Date(2026, 9, 30, 8), "coffee"),
      press(600, new Date(2026, 9, 30, 19), "beer"),
      press(800, new Date(2026, 10, 2, 13), "lunch"),
      press(350, new Date(2026, 10, 3, 8), "coffee"),
    ];
    const settlements = [
      { id: "s1", amountPence: 950, at: new Date(2026, 10, 1, 10).getTime() },
      { id: "s2", amountPence: 800, at: new Date(2026, 10, 3, 9).getTime() },
    ];
    expect(savingsSeries(presses, settlements, new Date(2026, 10, 3, 12)).days).toEqual([
      { day: "2026-10-28", savedPence: 0, investedPence: 0 },
      { day: "2026-10-29", savedPence: 0, investedPence: 0 },
      { day: "2026-10-30", savedPence: 950, investedPence: 0 },
      { day: "2026-10-31", savedPence: 950, investedPence: 0 },
      { day: "2026-11-01", savedPence: 950, investedPence: 950 },
      { day: "2026-11-02", savedPence: 1750, investedPence: 950 },
      { day: "2026-11-03", savedPence: 2100, investedPence: 1750 },
    ]);
  });

  it("an undone press is deleted from the ledger, so it neither counts nor starts the series", async () => {
    let id = 0;
    const ledger = new Ledger(new MemoryStore(), () => `u${++id}`);
    const early = await ledger.addPress("coffee", new Date(2026, 10, 1, 8));
    await ledger.undo(early.id);
    await ledger.addPress("beer", new Date(2026, 10, 17, 8));
    const series = savingsSeries(await ledger.presses(), [], new Date(2026, 10, 17, 12));
    expect(series.days.map((d) => d.day)).toEqual([
      "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17",
    ]);
    expect(series.savedPence).toBe(600);
  });

  it("days are local days: a press at 23:59 and one at 00:01 fall on different days", async () => {
    const clock = new FakeClock(new Date(2026, 10, 16, 23, 59));
    const ledger = new Ledger(new MemoryStore(), () => `c${clock.now().getTime()}`);
    await ledger.addPress("coffee", clock.now());
    clock.set(new Date(2026, 10, 17, 0, 1));
    await ledger.addPress("coffee", clock.now());
    const days = savingsSeries(await ledger.presses(), [], clock.now()).days;
    expect(days.slice(-3)).toEqual([
      { day: "2026-11-15", savedPence: 0, investedPence: 0 },
      { day: "2026-11-16", savedPence: 350, investedPence: 0 },
      { day: "2026-11-17", savedPence: 700, investedPence: 0 },
    ]);
  });
});

describe("savingsSeries agrees with the ledger", () => {
  const now = new Date(2026, 10, 17, 12);

  async function history() {
    const store = new MemoryStore();
    let id = 0;
    const ledger = new Ledger(store, () => `g${++id}`);
    for (const [item, at] of [
      ["coffee", new Date(2026, 7, 3, 8)],
      ["lunch", new Date(2026, 7, 20, 13)],
      ["beer", new Date(2026, 8, 12, 19)],
      ["coffee", new Date(2026, 9, 30, 8)],
      ["coffee", new Date(2026, 10, 17, 8)],
    ] as const) {
      await ledger.addPress(item, at);
    }
    await settle(store, 1150, new Date(2026, 7, 26, 9), () => "s1");
    await settle(store, 950, new Date(2026, 9, 26, 9), () => "s2");
    return { store, ledger };
  }

  it("the last point's saved figure, and the headline, equal the ledger's lifetime total", async () => {
    const { store, ledger } = await history();
    const series = savingsSeries(await ledger.presses(), await store.settlements.list(), now);
    expect(series.days[series.days.length - 1].savedPence).toBe(await ledger.lifetime());
    expect(series.savedPence).toBe(await ledger.lifetime());
  });

  it("the last point's invested figure, and the headline, equal the sum of settlements", async () => {
    const { store, ledger } = await history();
    const settlements = await store.settlements.list();
    const series = savingsSeries(await ledger.presses(), settlements, now);
    const sum = settlements.reduce((total, s) => total + s.amountPence, 0);
    expect(series.days[series.days.length - 1].investedPence).toBe(sum);
    expect(series.investedPence).toBe(sum);
  });
});
