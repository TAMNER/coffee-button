import { describe, expect, it } from "vitest";
import type { StarlingSpace } from "./starling";
import { connect, type StarlingApi } from "./starling-link";
import { MemoryStore } from "./store";

/** A Starling stand-in that records which relay and token it was made with. */
function fakeStarling(opts: { accounts?: string[]; spaces?: StarlingSpace[]; createdUid?: string } = {}) {
  const made: { relayUrl: string; token: string }[] = [];
  const created: { accountUid: string; name: string }[] = [];
  const api: StarlingApi = {
    accounts: async () => (opts.accounts ?? ["acc-1"]).map((accountUid) => ({ accountUid })),
    listSpaces: async () => opts.spaces ?? [],
    createSpace: async (accountUid, name) => {
      created.push({ accountUid, name });
      return opts.createdUid ?? "sg-new";
    },
  };
  const factory = (relayUrl: string, token: string) => {
    made.push({ relayUrl, token });
    return api;
  };
  return { factory, made, created };
}

const RELAY = "https://relay.example:8443";

describe("starling link: connect", () => {
  it("uses the first account and lists its Spaces, with the token and relay given, and stores nothing yet", async () => {
    const store = new MemoryStore();
    const spaces = [{ savingsGoalUid: "sg-1", name: "Holiday" }];
    const { factory, made } = fakeStarling({ accounts: ["acc-1", "acc-2"], spaces });

    const conn = await connect(store, factory, " tok-1 ", RELAY);

    expect(made).toEqual([{ relayUrl: RELAY, token: "tok-1" }]);
    expect(conn.accountUid).toBe("acc-1");
    expect(conn.spaces).toEqual(spaces);
    expect((await store.getSettings()).starling).toBeUndefined();
  });

  it("a token whose Starling login has no accounts is refused with 'No Starling account'", async () => {
    const { factory } = fakeStarling({ accounts: [] });

    await expect(connect(new MemoryStore(), factory, "tok", RELAY)).rejects.toThrow(/No Starling account/);
  });
});
