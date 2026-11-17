import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
import { addGoal, addStarter, ensureTargets, migrateTargets, removeGoal, removeTarget, setShelfPrice, shelfItems, shelfState, shelfTargets, shelfView, starterChips } from "./shelf";
import { EMPTY_SHELF_HINT, shelfHint } from "./shelf-hint";
import { MemoryStore } from "./store";

describe("shelfState", () => {
  it("with £500 lifetime the £400 espresso machine is lit and the £1000 laptop is half way", () => {
    const items = [
      { id: "espresso", name: "Espresso machine", pricePence: 40000 },
      { id: "laptop", name: "Laptop", pricePence: 100000 },
      { id: "exact", name: "Exactly reached", pricePence: 50000 },
    ];
    expect(shelfState(items, 50000)).toEqual([
      { id: "espresso", name: "Espresso machine", pricePence: 40000, lit: true, progress: 1 },
      { id: "laptop", name: "Laptop", pricePence: 100000, lit: false, progress: 0.5 },
      { id: "exact", name: "Exactly reached", pricePence: 50000, lit: true, progress: 1 },
    ]);
  });
});

describe("shelfItems", () => {
  it("a fresh store has the four default items, cheapest first, at their rough prices in pounds", async () => {
    const items = await shelfItems(new MemoryStore());
    expect(items.map((i) => [i.id, i.name, i.pricePence])).toEqual([
      ["weekend-away", "Weekend away", 30000],
      ["espresso-machine", "Espresso machine", 40000],
      ["laptop", "Laptop", 100000],
      ["ski-week", "Ski week", 150000],
    ]);
  });

  it("repricing the laptop to £1200 is kept in settings and leaves payday and other items alone", async () => {
    const store = new MemoryStore();
    await setShelfPrice(store, "laptop", 120000);

    const items = await shelfItems(store);
    expect(items.find((i) => i.id === "laptop")?.pricePence).toBe(120000);
    expect(items.find((i) => i.id === "espresso-machine")?.pricePence).toBe(40000);
    expect((await store.getSettings()).paydayDay).toBe(25);
  });

  it("an old install's stored price for a removed item (bike) shows nothing of it", async () => {
    const store = new MemoryStore();
    await setShelfPrice(store, "bike", 55000);

    expect((await shelfItems(store)).map((i) => i.id)).toEqual(["weekend-away", "espresso-machine", "laptop", "ski-week"]);
  });
});

describe("goals", () => {
  it("up to three goals are kept in the store; a fourth is rejected and not stored", async () => {
    const store = new MemoryStore();
    await addGoal(store, "Guitar", 45000);
    await addGoal(store, "Sofa", 80000);
    await addGoal(store, "Tent", 20000);

    await expect(addGoal(store, "Kayak", 70000)).rejects.toThrow();
    const goals = await store.goals.list();
    expect(goals.map((g) => [g.name, g.pricePence]).sort()).toEqual([
      ["Guitar", 45000],
      ["Sofa", 80000],
      ["Tent", 20000],
    ]);
  });

  it("removing a goal deletes it and frees a slot for another", async () => {
    const store = new MemoryStore();
    await addGoal(store, "Guitar", 45000);
    const sofa = await addGoal(store, "Sofa", 80000);
    await addGoal(store, "Tent", 20000);

    await removeGoal(store, sofa.id);
    await addGoal(store, "Kayak", 70000);

    expect((await store.goals.list()).map((g) => g.name).sort()).toEqual(["Guitar", "Kayak", "Tent"]);
  });
});

describe("shelfView", () => {
  it("on 31 March with £120 this year and £120 last year: pace £486.67, lifetime £240 compounds to £390.93, the injected overdue line is carried", async () => {
    const store = new MemoryStore();
    const put = (id: string, pricePence: number, at: Date) =>
      store.presses.put({ id, itemId: "coffee", pricePence, at: at.getTime() });
    await put("a", 12000, new Date(2025, 5, 1, 9));
    await put("b", 6000, new Date(2026, 0, 10, 9));
    await put("c", 6000, new Date(2026, 2, 31, 8));
    await addGoal(store, "Guitar", 45000);
    await ensureTargets(store); // used before: the goal plus the two cheapest built-ins

    const view = await shelfView({
      store,
      ledger: new Ledger(store),
      now: new Date(2026, 2, 31, 12),
      overdueLine: async () => "£12.00 owed since October",
    });

    expect(view.pacePence).toBe(48667);
    expect(view.lifetimePence).toBe(24000);
    expect(view.compoundedPence).toBe(39093);
    expect(view.overdueLine).toBe("£12.00 owed since October");
    expect(view.targets.map((t) => [t.name, t.pricePence, t.builtIn, t.lit, t.progress])).toEqual([
      ["Weekend away", 30000, true, false, 0.8],
      ["Espresso machine", 40000, true, false, 0.6],
      ["Guitar", 45000, false, false, 24000 / 45000],
    ]);
  });

  it("targets light by the lifetime total, built-in and typed alike: £450 lifetime lights the £300 weekend and the £450 guitar, the laptop is 45% there", async () => {
    const store = new MemoryStore();
    await store.putSettings({ paydayDay: 25, shelfBuiltInIds: ["weekend-away", "laptop"] });
    await addGoal(store, "Guitar", 45000);
    await store.presses.put({ id: "p1", itemId: "coffee", pricePence: 45000, at: new Date(2026, 0, 5).getTime() });
    await store.settlements.put({ id: "s1", amountPence: 45000, at: new Date(2026, 1, 1).getTime() });

    const view = await shelfView({ store, ledger: new Ledger(store), now: new Date(2026, 2, 1), overdueLine: () => null });

    expect(view.targets.map((t) => [t.name, t.lit, t.progress])).toEqual([
      ["Weekend away", true, 1],
      ["Guitar", true, 1],
      ["Laptop", false, 0.45],
    ]);
  });

  it("ticket 33: carries the latte graph from presses and settlements; seven daily glasses in the first week", async () => {
    const store = new MemoryStore();
    await store.presses.put({ id: "p1", itemId: "coffee", pricePence: 2800, at: new Date(2026, 10, 12, 8).getTime() });
    await store.settlements.put({ id: "s1", amountPence: 1000, at: new Date(2026, 10, 15, 8).getTime() });

    const view = await shelfView({ store, ledger: new Ledger(store), now: new Date(2026, 10, 17, 12), overdueLine: () => null });

    expect(view.graph?.glasses).toHaveLength(7);
    expect(view.graph?.savedLabel).toBe("£28 saved");
    expect(view.graph?.investedLabel).toBe("£10 invested");
  });

  it("ticket 33: with no presses the graph is absent and the first-press hint still shows", async () => {
    const store = new MemoryStore();
    const ledger = new Ledger(store);
    const view = await shelfView({ store, ledger, now: new Date(2026, 10, 17, 12), overdueLine: () => null });
    expect(view.graph).toBeNull();
    expect(shelfHint(await ledger.presses())).toBe(EMPTY_SHELF_HINT);
  });
});

describe("targets (ticket 30)", () => {
  it("built-ins on the plank and typed goals are one list, cheapest first, built-ins at their edited prices", async () => {
    const store = new MemoryStore();
    await store.putSettings({ paydayDay: 25, shelfBuiltInIds: ["laptop", "ski-week"], shelfPrices: { laptop: 160000 } });
    await store.goals.put({ id: "g1", name: "Guitar", pricePence: 45000 });

    expect((await shelfTargets(store)).map((t) => [t.id, t.name, t.pricePence, t.builtIn])).toEqual([
      ["g1", "Guitar", 45000, false],
      ["ski-week", "Ski week", 150000, true],
      ["laptop", "Laptop", 160000, true],
    ]);
  });

  it("a new install starts with exactly Weekend away £300, Laptop £1000 and Ski week £1500", async () => {
    const store = new MemoryStore();

    await ensureTargets(store);

    expect((await shelfTargets(store)).map((t) => [t.id, t.name, t.pricePence, t.builtIn])).toEqual([
      ["weekend-away", "Weekend away", 30000, true],
      ["laptop", "Laptop", 100000, true],
      ["ski-week", "Ski week", 150000, true],
    ]);
  });
});

describe("targets: adding and removing", () => {
  it("on a new install's full plank of three built-ins, adding a fourth target is refused and nothing is stored", async () => {
    const store = new MemoryStore();
    await ensureTargets(store);

    await expect(addGoal(store, "Guitar", 45000)).rejects.toThrow();

    expect(await store.goals.list()).toEqual([]);
    expect(await shelfTargets(store)).toHaveLength(3);
  });

  it("the shelf view carries the starter chips: after removing the Ski week, Espresso machine £400 then Ski week £1500", async () => {
    const store = new MemoryStore();
    await ensureTargets(store);
    await removeTarget(store, "ski-week");

    const view = await shelfView({ store, ledger: new Ledger(store), now: new Date(2026, 2, 1), overdueLine: () => null });

    expect(view.starters.map((s) => [s.id, s.name, s.pricePence])).toEqual([
      ["espresso-machine", "Espresso machine", 40000],
      ["ski-week", "Ski week", 150000],
    ]);
  });

  it("removing the Laptop takes it off the plank, frees a place, and the next launch does not bring it back", async () => {
    const store = new MemoryStore();
    await ensureTargets(store);

    await removeTarget(store, "laptop");
    await ensureTargets(store);
    await addGoal(store, "Guitar", 45000);

    expect((await shelfTargets(store)).map((t) => t.name)).toEqual(["Weekend away", "Guitar", "Ski week"]);
  });

  it("removeTarget removes a typed target too; with everything removed the plank stays empty after a launch", async () => {
    const store = new MemoryStore();
    await store.putSettings({ paydayDay: 25, shelfBuiltInIds: ["weekend-away"] });
    const guitar = await addGoal(store, "Guitar", 45000);

    await removeTarget(store, guitar.id);
    await removeTarget(store, "weekend-away");
    await ensureTargets(store);

    expect(await shelfTargets(store)).toEqual([]);
    expect(await store.goals.list()).toEqual([]);
  });
});

describe("targets: migrating a phone from before ticket 30", () => {
  const GOALS = [
    { id: "g1", name: "Guitar", pricePence: 45000 },
    { id: "g2", name: "Sofa", pricePence: 180000 },
    { id: "g3", name: "Tent", pricePence: 20000 },
  ];

  /** Four built-ins; the espresso machine repriced to £1200, so cheapest-first must use edited prices. */
  async function oldPhone(goalCount: number): Promise<MemoryStore> {
    const store = new MemoryStore();
    await store.putSettings({ paydayDay: 25, shelfPrices: { "espresso-machine": 120000 } });
    for (const goal of GOALS.slice(0, goalCount)) await store.goals.put(goal);
    return store;
  }

  it.each([
    [0, ["weekend-away", "laptop", "espresso-machine"]],
    [1, ["weekend-away", "laptop"]],
    [2, ["weekend-away"]],
    [3, []],
  ])("with %i goals the plank keeps every goal and fills up with the cheapest built-ins: %j", async (n, builtIns) => {
    const store = await oldPhone(n);

    await migrateTargets(store);

    const targets = await shelfTargets(store);
    expect(targets.filter((t) => !t.builtIn).map((t) => t.id).sort()).toEqual(GOALS.slice(0, n).map((g) => g.id).sort());
    expect(targets.filter((t) => t.builtIn).map((t) => t.id)).toEqual(builtIns);
    expect(targets.find((t) => t.id === "espresso-machine")?.pricePence ?? 120000).toBe(120000);
  });

  it("running the migration twice changes nothing, even after the plank was changed in between", async () => {
    const store = await oldPhone(1);

    await migrateTargets(store);
    await store.putSettings({ ...(await store.getSettings()), shelfBuiltInIds: ["laptop"] });
    const before = await store.getSettings();
    await migrateTargets(store);

    expect(await store.getSettings()).toEqual(before);
    expect(await store.goals.list()).toEqual([GOALS[0]]);
  });

  it.each<[string, (store: MemoryStore) => Promise<void>]>([
    ["a press", (s) => s.presses.put({ id: "p1", itemId: "coffee", pricePence: 350, at: 1 })],
    ["a settlement", (s) => s.settlements.put({ id: "s1", amountPence: 350, at: 1 })],
    ["a goal", (s) => s.goals.put({ id: "g1", name: "Guitar", pricePence: 45000 })],
    ["an edited shelf price", (s) => s.putSettings({ paydayDay: 25, shelfPrices: { laptop: 90000 } })],
    ["the info sheet seen", (s) => s.putSettings({ paydayDay: 25, infoSeen: true })],
  ])("at launch, a phone with %s and no plank yet is migrated, not given the new-install three", async (_, setUp) => {
    const store = new MemoryStore();
    await setUp(store);
    const expected = new MemoryStore();
    await setUp(expected);
    await migrateTargets(expected);

    await ensureTargets(store);

    expect(await store.getSettings()).toEqual(await expected.getSettings());
  });
});

describe("starter chips (ticket 31)", () => {
  it("after removing the Laptop, the starters are the built-ins not on the plank, cheapest first, at their current prices", async () => {
    const store = new MemoryStore();
    await ensureTargets(store);
    await setShelfPrice(store, "espresso-machine", 120000);
    await removeTarget(store, "laptop");

    expect((await starterChips(store)).map((s) => [s.id, s.name, s.pricePence])).toEqual([
      ["laptop", "Laptop", 100000],
      ["espresso-machine", "Espresso machine", 120000],
    ]);
  });

  it("with three targets there are no chips, though the Espresso machine is off the plank", async () => {
    const store = new MemoryStore();
    await ensureTargets(store);

    expect(await starterChips(store)).toEqual([]);
  });

  it("adding the removed Laptop back puts it on the plank as a built-in at the £1200 it was given, and its chip goes", async () => {
    const store = new MemoryStore();
    await ensureTargets(store);
    await setShelfPrice(store, "laptop", 120000);
    await removeTarget(store, "laptop");

    await addStarter(store, "laptop");

    expect((await shelfTargets(store)).map((t) => [t.id, t.pricePence, t.builtIn])).toEqual([
      ["weekend-away", 30000, true],
      ["laptop", 120000, true],
      ["ski-week", 150000, true],
    ]);
    expect(await starterChips(store)).toEqual([]);
  });

  it("on a full plank adding the Espresso machine is refused and the plank is unchanged", async () => {
    const store = new MemoryStore();
    await ensureTargets(store);

    await expect(addStarter(store, "espresso-machine")).rejects.toThrow();

    expect((await shelfTargets(store)).map((t) => t.id)).toEqual(["weekend-away", "laptop", "ski-week"]);
  });

  it("a double tap on the Laptop chip puts it on the plank once", async () => {
    const store = new MemoryStore();
    await store.putSettings({ paydayDay: 25, shelfBuiltInIds: [] });

    await addStarter(store, "laptop");
    await addStarter(store, "laptop");

    expect((await shelfTargets(store)).map((t) => t.id)).toEqual(["laptop"]);
  });
});
