import { describe, expect, it } from "vitest";
import { FakeClipboard } from "../adapters/clipboard";
import { FakeClock } from "../adapters/clock";
import { FakeUrlOpener } from "../adapters/open-url";
import { Ledger } from "./ledger";
import { lookOnlyStore, parsePretendDate, pretendClock } from "./pretend";
import { InvestFlow, owed } from "./settle";
import { MemoryStore, type Settlement } from "./store";

describe("parsePretendDate", () => {
  it('reads "2026-11-26" (what a date field gives) as 26 November 2026, local midnight', () => {
    expect(parsePretendDate("2026-11-26")).toEqual(new Date(2026, 10, 26));
  });

  it.each([null, undefined, "", "  ", "hello", "2026-02-30", "2026-13-01", "2026-11-00", "26/11/2026", "2026-11-26T09:00"])(
    "rejects %j, which is not a real date",
    (raw) => {
      expect(parsePretendDate(raw)).toBeNull();
    },
  );
});

describe("pretendClock", () => {
  it("is the pretend day at the real time of day, and keeps ticking with the real clock", () => {
    const real = new FakeClock(new Date(2026, 10, 17, 10, 15, 30));
    const clock = pretendClock(new Date(2026, 10, 26), real);

    expect(clock.now()).toEqual(new Date(2026, 10, 26, 10, 15, 30));
    real.set(new Date(2026, 10, 17, 10, 16, 0));
    expect(clock.now()).toEqual(new Date(2026, 10, 26, 10, 16, 0));
  });
});

/** A real store owing £3.50 from a press on 10 November, and the app's view of it on a pretend 26 November. */
async function pretending() {
  const store = new MemoryStore();
  await store.presses.put({ id: "real", itemId: "coffee", pricePence: 350, at: new Date(2026, 10, 10, 8, 0).getTime() });
  const clock = pretendClock(new Date(2026, 10, 26), new FakeClock(new Date(2026, 10, 17, 9, 0)));
  return { store, clock, view: lookOnlyStore(store) };
}

describe("lookOnlyStore: money is look-only on a pretend date", () => {
  it("a press and a Yes, I invested leave the ledger and the owed £3.50 unchanged, while both still report what happened", async () => {
    const { store, clock, view } = await pretending();
    const before = { presses: await store.presses.list(), settlements: await store.settlements.list() };
    const settled: Settlement[] = [];
    const opener = new FakeUrlOpener();
    const flow = new InvestFlow({ store: view, clock, clipboard: new FakeClipboard(), opener, onSettled: (s) => void settled.push(s) });

    const press = await new Ledger(view).addPress("coffee", clock.now());
    await flow.invest(await owed(view, clock.now()));
    opener.returnToApp();
    const settlement = await flow.yes();

    expect(press.pricePence).toBe(350); // the press ceremony still has its press
    expect(settled).toEqual([settlement]); // and the settle ceremony its settlement
    expect(settlement?.amountPence).toBe(350);
    expect(await store.presses.list()).toEqual(before.presses);
    expect(await store.settlements.list()).toEqual(before.settlements);
    expect(await owed(store, clock.now())).toBe(350);
  });
});
