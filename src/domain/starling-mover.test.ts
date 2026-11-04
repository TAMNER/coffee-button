import { describe, expect, it } from "vitest";
import { StarlingAuthError, StarlingNetworkError, StarlingRateLimited } from "./starling";
import { StarlingMover, waitingCount, waitingTotal, type StarlingTransfers, type Timers } from "./starling-mover";
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
});
