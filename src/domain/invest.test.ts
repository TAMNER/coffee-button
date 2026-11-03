import { describe, expect, it } from "vitest";
import { FakeClipboard } from "../adapters/clipboard";
import { FakeClock } from "../adapters/clock";
import { FakeUrlOpener } from "../adapters/open-url";
import { InvestFlow, owed } from "./settle";
import { MemoryStore, type Settlement } from "./store";

function setup(failing: string[] = [], onSettled: (s: Settlement) => void | Promise<void> = () => {}) {
  const store = new MemoryStore();
  const clock = new FakeClock(new Date(2026, 10, 26, 9, 0));
  const clipboard = new FakeClipboard();
  const opener = new FakeUrlOpener(failing);
  const flow = new InvestFlow({ store, clock, clipboard, opener, onSettled });
  return { store, clock, clipboard, opener, flow };
}

describe("InvestFlow", () => {
  it('copies "12.50" for £12.50, pounds and pence with no symbol', async () => {
    const { clipboard, flow } = setup();

    await flow.invest(1250);

    expect(clipboard.written).toEqual(["12.50"]);
  });

  it("opens https://investengine.com/ and nothing else when that open works", async () => {
    const { opener, flow } = setup();

    await flow.invest(1250);

    expect(opener.opened).toEqual(["https://investengine.com/"]);
  });

  it("falls back to the App Store page when opening investengine.com fails", async () => {
    const { opener, flow } = setup(["https://investengine.com/"]);

    await flow.invest(1250);

    expect(opener.opened).toEqual([
      "https://investengine.com/",
      "https://apps.apple.com/gb/app/investengine/id1485669937",
    ]);
  });

  it('asks "Did you invest £12.50?" once the user comes back to the app', async () => {
    const { opener, flow } = setup();
    const prompts: string[] = [];
    flow.onPrompt((text) => prompts.push(text));

    await flow.invest(1250);
    expect(prompts).toEqual([]);
    opener.returnToApp();

    expect(prompts).toEqual(["Did you invest £12.50?"]);
  });

  it("Yes records a £12.50 settlement at the Invest tap's time, then reports it with the settlement already stored", async () => {
    const storedWhenReported: unknown[] = [];
    const { store, opener, flow } = setup([], async () => {
      storedWhenReported.push(...(await store.settlements.list()));
    });
    await flow.invest(1250);
    opener.returnToApp();

    const settlement = await flow.yes();

    const expected = { id: settlement!.id, amountPence: 1250, at: new Date(2026, 10, 26, 9, 0).getTime() };
    expect(await store.settlements.list()).toEqual([expected]);
    expect(storedWhenReported).toEqual([expected]);
  });

  it("Not yet records nothing, reports nothing, and a later Yes has nothing to settle", async () => {
    const reported: Settlement[] = [];
    const { store, opener, flow } = setup([], (s) => {
      reported.push(s);
    });
    await flow.invest(1250);
    opener.returnToApp();

    flow.notYet();

    expect(await flow.yes()).toBeNull();
    expect(await store.settlements.list()).toEqual([]);
    expect(reported).toEqual([]);
  });

  it("a £3.50 press made while the prompt is up stays owed after Yes: the £24.00 settles at the Invest tap's time", async () => {
    const { store, clock, opener, flow } = setup();
    await store.presses.put({ id: "oct", itemId: "coffee", pricePence: 2400, at: new Date(2026, 10, 20, 9, 0).getTime() });
    await flow.invest(2400);
    opener.returnToApp();
    clock.set(new Date(2026, 10, 26, 9, 5));
    await store.presses.put({ id: "mid", itemId: "coffee", pricePence: 350, at: new Date(2026, 10, 26, 9, 5).getTime() });
    clock.set(new Date(2026, 10, 26, 9, 10));

    await flow.yes();

    expect(await owed(store, new Date(2026, 10, 26, 9, 10))).toBe(350);
    expect((await store.settlements.list()).map((s) => s.at)).toEqual([new Date(2026, 10, 26, 9, 0).getTime()]);
  });
});
