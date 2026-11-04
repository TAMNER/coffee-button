import { describe, expect, it } from "vitest";
import { StarlingAuthError, StarlingError, StarlingNetworkError, StarlingRateLimited } from "./starling";
import { moverFor, StarlingMover, waitingCount, waitingLine, waitingTotal, type StarlingTransfers, type Timers } from "./starling-mover";
import { LedgerMover } from "./money-mover";
import { MemoryStore, type Press, type StarlingLink } from "./store";

const LINK: StarlingLink = {
  token: "tok",
  relayUrl: "https://relay.example",
  accountUid: "acc-1",
  spaceUid: "sg-1",
  spaceName: "Coffee Button",
};

/** Timers that only run when the test advances them. */
class FakeTimers implements Timers {
  now = 0;
  private next = 1;
  private due = new Map<number, { at: number; fn: () => void }>();
  set(fn: () => void, ms: number): number {
    const id = this.next++;
    this.due.set(id, { at: this.now + ms, fn });
    return id;
  }
  clear(handle: unknown): void {
    this.due.delete(handle as number);
  }
  advance(ms: number): void {
    this.now += ms;
    for (const [id, t] of [...this.due].sort((a, b) => a[1].at - b[1].at)) {
      if (t.at <= this.now) {
        this.due.delete(id);
        t.fn();
      }
    }
  }
}

type Call = { accountUid: string; spaceUid: string; transferUid: string; amountPence: number; reference: string };

/** A Starling stand-in: each addMoney answers with the next scripted outcome (default success). */
function fakeClient(outcomes: (Error | "ok")[] = []) {
  const calls: Call[] = [];
  const client: StarlingTransfers = {
    async addMoney(accountUid, spaceUid, transferUid, amountPence, reference) {
      calls.push({ accountUid, spaceUid, transferUid, amountPence, reference });
      const outcome = outcomes.shift() ?? "ok";
      if (outcome !== "ok") throw outcome;
      return { transferUid, success: true };
    },
  };
  return { client, calls };
}

async function setup(opts: { outcomes?: (Error | "ok")[]; linked?: boolean } = {}) {
  const store = new MemoryStore();
  if (opts.linked !== false) await store.putSettings({ ...(await store.getSettings()), starling: LINK });
  const timers = new FakeTimers();
  const { client, calls } = fakeClient(opts.outcomes);
  let uid = 0;
  const mover = new StarlingMover(store, () => client, { timers, newUid: () => `uid-${++uid}`, undoMs: 5000 });
  const addPress = async (id: string, at = 0, itemId = "coffee", pricePence = 350) => {
    const p: Press = { id, itemId, pricePence, at };
    await store.presses.put(p);
    return p;
  };
  return { store, timers, calls, mover, addPress };
}

const press = (id: string, pricePence: number, state?: "waiting" | "moved" | "failed"): Press => ({
  id,
  itemId: "coffee",
  pricePence,
  at: 0,
  ...(state ? { transfer: { state, transferUid: `t-${id}` } } : {}),
});

describe("waiting presses", () => {
  it("counts and sums only presses whose transfer is waiting", () => {
    const presses = [
      press("a", 350, "waiting"),
      press("b", 600, "moved"),
      press("c", 800),
      press("d", 350, "failed"),
      press("e", 600, "waiting"),
    ];

    expect(waitingCount(presses)).toBe(2);
    expect(waitingTotal(presses)).toBe(950);
  });

  it("the Settings line reads 'N presses waiting to move', singular for one, empty for none", () => {
    expect(waitingLine([press("a", 350, "moved")])).toBe("");
    expect(waitingLine([press("a", 350, "waiting")])).toBe("1 press waiting to move");
    expect(waitingLine([press("a", 350, "waiting"), press("b", 600, "waiting")])).toBe("2 presses waiting to move");
  });
});

describe("choosing the mover at boot", () => {
  it("a stored Starling link gets a StarlingMover; no link keeps the LedgerMover it was given", async () => {
    const ledger = new LedgerMover();
    const make = () => new StarlingMover(new MemoryStore(), () => fakeClient().client);
    const { store: linked } = await setup();
    const { store: unlinked } = await setup({ linked: false });

    expect(await moverFor(linked, ledger, make)).toBeInstanceOf(StarlingMover);
    expect(await moverFor(unlinked, ledger, make)).toBe(ledger);
  });
});

describe("StarlingMover: scheduling", () => {
  it("move() marks the press waiting with a fresh transferUid and moves nothing inside the undo window", async () => {
    const { store, timers, calls, mover, addPress } = await setup();
    await addPress("p1");

    expect(await mover.move(350, { pressId: "p1" })).toEqual({ ok: true });
    timers.advance(4999);
    await mover.idle();

    expect((await store.presses.get("p1"))?.transfer).toEqual({ state: "waiting", transferUid: "uid-1" });
    expect(calls).toEqual([]);
  });

  it("a drain (return to the app) inside a press's undo window leaves that press alone", async () => {
    const { timers, calls, mover, addPress } = await setup();
    await addPress("p1");
    await mover.move(350, { pressId: "p1" });

    timers.advance(1000);
    await mover.drain();

    expect(calls).toEqual([]);
  });

  it("with no Starling link stored (disconnected) move() leaves the press as a plain ledger entry", async () => {
    const { store, timers, calls, mover, addPress } = await setup({ linked: false });
    await addPress("p1");

    expect(await mover.move(350, { pressId: "p1" })).toEqual({ ok: true });
    timers.advance(5000);
    await mover.idle();

    expect((await store.presses.get("p1"))?.transfer).toBeUndefined();
    expect(calls).toEqual([]);
  });

  it("cancel() inside the window (undo) disarms the timer, so the window closing moves nothing", async () => {
    const { timers, calls, mover, addPress } = await setup();
    await addPress("p1");
    await mover.move(350, { pressId: "p1" });

    timers.advance(2000);
    mover.cancel({ pressId: "p1" });
    timers.advance(10_000);
    await mover.idle();

    expect(calls).toEqual([]);
  });

  it("a press undone inside the window is gone from the ledger, so a later drain moves nothing for it", async () => {
    const { store, timers, calls, mover, addPress } = await setup();
    await addPress("p1");
    await mover.move(350, { pressId: "p1" });

    mover.cancel({ pressId: "p1" });
    await store.presses.delete("p1"); // the ledger's undo
    timers.advance(10_000);
    await mover.drain();

    expect(calls).toEqual([]);
  });
});

describe("StarlingMover: firing", () => {
  it("when the undo window closes it adds the price to the Space with the press's transferUid and marks it moved", async () => {
    const { store, timers, calls, mover, addPress } = await setup();
    await addPress("p1", 0, "beer", 600);

    await mover.move(600, { pressId: "p1" });
    timers.advance(5000);
    await mover.idle();

    expect(calls).toEqual([
      { accountUid: "acc-1", spaceUid: "sg-1", transferUid: "uid-1", amountPence: 600, reference: "Coffee Button: Beer" },
    ]);
    expect((await store.presses.get("p1"))?.transfer).toEqual({ state: "moved", transferUid: "uid-1", attempts: 1 });
  });
});

describe("StarlingMover: retry queue", () => {
  it("offline or relay 5xx leaves the press waiting; the next drain retries it with the same transferUid", async () => {
    const { store, timers, calls, mover, addPress } = await setup({
      outcomes: [new StarlingNetworkError(), new StarlingNetworkError(502)],
    });
    await addPress("p1");
    await mover.move(350, { pressId: "p1" });
    timers.advance(5000);
    await mover.idle();

    expect((await store.presses.get("p1"))?.transfer).toMatchObject({ state: "waiting", transferUid: "uid-1", attempts: 1 });

    await mover.drain(); // 502
    await mover.drain(); // ok

    expect(calls.map((c) => c.transferUid)).toEqual(["uid-1", "uid-1", "uid-1"]);
    expect((await store.presses.get("p1"))?.transfer).toEqual({ state: "moved", transferUid: "uid-1", attempts: 3 });
  });

  it("drain on launch moves stored waiting presses oldest first, skipping moved, failed and unlinked ones", async () => {
    const { store, calls, mover } = await setup();
    const put = (id: string, at: number, state?: "waiting" | "moved" | "failed") =>
      store.presses.put({ ...press(id, 350, state), at });
    await put("late", 300, "waiting");
    await put("early", 100, "waiting");
    await put("mid", 200, "waiting");
    await put("done", 50, "moved");
    await put("dead", 60, "failed");
    await put("ledger-only", 70);

    await mover.drain();

    expect(calls.map((c) => c.transferUid)).toEqual(["t-early", "t-mid", "t-late"]);
  });

  it("a network failure stops the run: later presses wait for the next drain", async () => {
    const { store, calls, mover } = await setup({ outcomes: [new StarlingNetworkError()] });
    await store.presses.put({ ...press("a", 350, "waiting"), at: 1 });
    await store.presses.put({ ...press("b", 350, "waiting"), at: 2 });

    await mover.drain();

    expect(calls.map((c) => c.transferUid)).toEqual(["t-a"]);
    expect((await store.presses.get("b"))?.transfer).toEqual({ state: "waiting", transferUid: "t-b" });
  });

  it("401/403 marks the press failed, sets starlingAuthFailed and stops every later drain", async () => {
    const { store, calls, mover } = await setup({ outcomes: [new StarlingAuthError(401)] });
    await store.presses.put({ ...press("a", 350, "waiting"), at: 1 });
    await store.presses.put({ ...press("b", 350, "waiting"), at: 2 });

    await mover.drain();
    await mover.drain();

    expect(calls.map((c) => c.transferUid)).toEqual(["t-a"]);
    expect((await store.presses.get("a"))?.transfer).toMatchObject({ state: "failed", attempts: 1 });
    expect((await store.presses.get("b"))?.transfer?.state).toBe("waiting");
    expect((await store.getSettings()).starlingAuthFailed).toBe(true);
  });

  it("429 keeps the press waiting and tries again by itself after Retry-After, not before", async () => {
    const { store, timers, calls, mover } = await setup({ outcomes: [new StarlingRateLimited(30_000)] });
    await store.presses.put({ ...press("a", 350, "waiting"), at: 1 });

    await mover.drain();
    expect((await store.presses.get("a"))?.transfer).toMatchObject({ state: "waiting", attempts: 1 });
    timers.advance(29_999);
    await mover.idle();
    expect(calls).toHaveLength(1);

    timers.advance(1);
    await mover.idle();

    expect(calls).toHaveLength(2);
    expect((await store.presses.get("a"))?.transfer?.state).toBe("moved");
  });

  it("any other Starling refusal (e.g. HTTP 400) fails that press only and the queue moves on", async () => {
    const { store, calls, mover } = await setup({ outcomes: [new StarlingError("Starling answered HTTP 400", 400)] });
    await store.presses.put({ ...press("a", 350, "waiting"), at: 1 });
    await store.presses.put({ ...press("b", 350, "waiting"), at: 2 });

    await mover.drain();

    expect(calls.map((c) => c.transferUid)).toEqual(["t-a", "t-b"]);
    expect((await store.presses.get("a"))?.transfer).toMatchObject({ state: "failed", lastError: "Starling answered HTTP 400" });
    expect((await store.presses.get("b"))?.transfer?.state).toBe("moved");
    expect((await store.getSettings()).starlingAuthFailed).toBeUndefined();
  });

  it("onSettled runs after every queue run, so the cup banner and Settings line can redraw", async () => {
    const store = new MemoryStore();
    await store.putSettings({ ...(await store.getSettings()), starling: LINK });
    await store.presses.put({ ...press("a", 350, "waiting"), at: 1 });
    const settled: string[] = [];
    const mover = new StarlingMover(store, () => fakeClient([new StarlingAuthError(403)]).client, {
      onSettled: async () => {
        settled.push(String((await store.getSettings()).starlingAuthFailed));
      },
    });

    await mover.drain();
    await new Promise((r) => setTimeout(r, 0));

    expect(settled).toEqual(["true"]);
  });

  it("a drain during the 429 back-off (a return to the app) does not call Starling early", async () => {
    const { store, calls, mover } = await setup({ outcomes: [new StarlingRateLimited(undefined)] });
    await store.presses.put({ ...press("a", 350, "waiting"), at: 1 });

    await mover.drain();
    await mover.drain();

    expect(calls).toHaveLength(1);
  });
});
